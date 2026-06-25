import assert from "node:assert/strict";
import test from "node:test";
import {
	BASE_MAP_LAYER_SPECS,
	CHART_LAYER_Z_INDEX,
	CHART_TILE_MAX_ZOOM,
	createChartMapLayers,
	createOpenSeaMapLayer,
	NATURAL_EARTH_MAX_DATA_ZOOM,
	NATURAL_EARTH_BASE_MAP_NAME,
	OPEN_SEA_MAP_MAX_NATIVE_ZOOM,
	OPEN_SEA_MAP_TILE_URL,
	openSeaMapLayerOptions,
	SEAMARK_LAYER_Z_INDEX,
} from "../src/web/assets/scripts/chart-map-layer-factories.mjs";

function fakeLeaflet() {
	return {
		tileLayer(url, options = {}) {
			return { kind: "tileLayer", url, options };
		},
	};
}

function fakeProtomaps() {
	return {
		paintRules(theme) {
			return { kind: "paintRules", theme };
		},
		labelRules(theme) {
			return { kind: "labelRules", theme };
		},
		leafletLayer(options) {
			return { kind: "protomapsLayer", options };
		},
	};
}

test("createChartMapLayers returns expected basemap names", () => {
	const layers = createChartMapLayers({
		L: fakeLeaflet(),
		protomapsL: fakeProtomaps(),
		pmtilesUrl: "/assets/ne_10m_land.pmtiles",
	});

	assert.deepEqual(Object.keys(layers.baseMaps), [
		"Empty",
		"OpenStreetMap",
		"OpenTopoMap",
		"Satellite",
		NATURAL_EARTH_BASE_MAP_NAME,
	]);
});

test("base map definitions keep external tile layers explicit and ordered", () => {
	assert.deepEqual(
		BASE_MAP_LAYER_SPECS.map((spec) => spec.name),
		["Empty", "OpenStreetMap", "OpenTopoMap", "Satellite"],
	);
	assert.equal(BASE_MAP_LAYER_SPECS[1].options.maxZoom, 19);
	assert.match(BASE_MAP_LAYER_SPECS[2].url, /opentopomap/);
	assert.equal(BASE_MAP_LAYER_SPECS[3].options.maxNativeZoom, 17);
});

test("createChartMapLayers makes NaturalEarth offline from the bundled PMTiles file", () => {
	const layers = createChartMapLayers({
		L: fakeLeaflet(),
		protomapsL: fakeProtomaps(),
		pmtilesUrl: "/assets/ne_10m_land.pmtiles",
	});

	assert.equal(layers.baseMaps["NaturalEarth (offline)"].kind, "protomapsLayer");
	assert.equal(
		layers.baseMaps["NaturalEarth (offline)"].options.url,
		"/assets/ne_10m_land.pmtiles",
	);
	assert.equal(
		layers.baseMaps["NaturalEarth (offline)"].options.maxDataZoom,
		NATURAL_EARTH_MAX_DATA_ZOOM,
	);
	assert.equal(layers.paintRules.theme.water, "rgba(0,0,0,0)");
});

test("createOpenSeaMapLayer keeps seamarks above chart tiles", () => {
	const seamarks = createOpenSeaMapLayer({ L: fakeLeaflet() });

	assert.equal(
		seamarks.url,
		OPEN_SEA_MAP_TILE_URL,
	);
	assert.equal(seamarks.options.maxNativeZoom, OPEN_SEA_MAP_MAX_NATIVE_ZOOM);
	assert.equal(seamarks.options.maxZoom, CHART_TILE_MAX_ZOOM);
	assert.equal(seamarks.options.zIndex, SEAMARK_LAYER_Z_INDEX);
	assert.deepEqual(seamarks.options, openSeaMapLayerOptions());
});

test("chart layer constants keep seamarks above chart tiles", () => {
	assert.equal(CHART_LAYER_Z_INDEX, 650);
	assert.equal(SEAMARK_LAYER_Z_INDEX, 750);
	assert.ok(SEAMARK_LAYER_Z_INDEX > CHART_LAYER_Z_INDEX);
	assert.equal(CHART_TILE_MAX_ZOOM, 22);
	assert.equal(NATURAL_EARTH_MAX_DATA_ZOOM, 5);
});
