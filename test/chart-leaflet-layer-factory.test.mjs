import assert from "node:assert/strict";
import test from "node:test";
import {
	REQUIRED_LEAFLET_LAYER_METHODS,
	createChartLeafletLayer,
	isLeafletLayer,
} from "../src/web/assets/scripts/chart-leaflet-layer-factory.mjs";

function leafletLayer(name = "layer") {
	return {
		name,
		addTo() {},
		remove() {},
	};
}

test("isLeafletLayer recognises the minimal layer API AJRM Marine needs", () => {
	assert.deepEqual(REQUIRED_LEAFLET_LAYER_METHODS, ["addTo", "remove"]);
	assert.equal(isLeafletLayer(leafletLayer()), true);
	assert.equal(isLeafletLayer({ addTo() {} }), false);
	assert.equal(isLeafletLayer(null), false);
});

test("createChartLeafletLayer creates raster tile layers with established options", () => {
	let tileConfig;
	const layer = leafletLayer("raster");
	const result = createChartLeafletLayer({
		L: {
			tileLayer(url, options) {
				tileConfig = { url, options };
				return layer;
			},
		},
		protomapsL: {},
		chart: {
			url: "/charts/123/{z}/{x}/{y}.png",
			minzoom: 7,
			maxzoom: 14,
		},
	});

	assert.equal(result, layer);
	assert.equal(tileConfig.url, "/charts/123/{z}/{x}/{y}.png");
	assert.deepEqual(
		{
			maxNativeZoom: tileConfig.options.maxNativeZoom,
			minNativeZoom: tileConfig.options.minNativeZoom,
			maxZoom: tileConfig.options.maxZoom,
			minZoom: tileConfig.options.minZoom,
			zIndex: tileConfig.options.zIndex,
			attribution: tileConfig.options.attribution,
		},
		{
			maxNativeZoom: 14,
			minNativeZoom: 7,
			maxZoom: 22,
			minZoom: 7,
			zIndex: 650,
			attribution: "",
		},
	);
	assert.match(tileConfig.options.errorTileUrl, /^data:image\/gif;base64,/);
});

test("createChartLeafletLayer creates MVT layers with paint and label rules", () => {
	let mvtConfig;
	const layer = leafletLayer("mvt");
	const paintRules = [{ dataLayer: "water" }];
	const labelRules = [{ dataLayer: "places" }];
	const result = createChartLeafletLayer({
		L: {},
		protomapsL: {
			leafletLayer(config) {
				mvtConfig = config;
				return layer;
			},
		},
		chart: {
			format: "mvt",
			tilemapUrl: "/charts/vector.pmtiles",
			maxZoom: 12,
		},
		paintRules,
		labelRules,
	});

	assert.equal(result, layer);
	assert.deepEqual(mvtConfig, {
		url: "/charts/vector.pmtiles",
		maxDataZoom: 12,
		paintRules,
		labelRules,
		zIndex: 650,
	});
});

test("createChartLeafletLayer returns null for missing URL, invalid layer, or creation errors", () => {
	assert.equal(
		createChartLeafletLayer({ L: {}, protomapsL: {}, chart: {} }),
		null,
	);
	assert.equal(
		createChartLeafletLayer({
			L: {
				tileLayer() {
					return {};
				},
			},
			protomapsL: {},
			chart: { url: "/bad" },
		}),
		null,
	);

	const warnings = [];
	assert.equal(
		createChartLeafletLayer({
			L: {
				tileLayer() {
					throw new Error("tile failure");
				},
			},
			protomapsL: {},
			chart: { __autoChartId: "c1", name: "Chart 1", url: "/bad" },
			warn(...args) {
				warnings.push(args);
			},
		}),
		null,
	);
	assert.equal(warnings.length, 1);
	assert.equal(warnings[0][0], "[AJRM Marine charts] failed creating chart layer");
	assert.equal(warnings[0][1].id, "c1");
	assert.equal(warnings[0][1].error, "tile failure");
});
