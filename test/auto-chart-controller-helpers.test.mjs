import assert from "node:assert/strict";
import test from "node:test";
import {
	createAutoChartChooser,
	createAutoChartControllerParts,
	createAutoChartLayerMaker,
	ensureAutoChartGroupVisible,
	shouldUpdateAutoChartLayer,
} from "../src/web/assets/scripts/auto-chart-controller-helpers.mjs";

function fakeGroup(calls = []) {
	return {
		addTo(map) {
			calls.push("addTo");
			map.present = true;
		},
	};
}

test("ensureAutoChartGroupVisible adds the group only when enabled and absent", () => {
	const calls = [];
	const group = fakeGroup(calls);
	const map = {
		present: false,
		hasLayer(layer) {
			return layer === group && this.present;
		},
	};

	assert.equal(ensureAutoChartGroupVisible({ enabled: true, group, map }), true);
	assert.equal(ensureAutoChartGroupVisible({ enabled: true, group, map }), false);
	assert.equal(ensureAutoChartGroupVisible({ enabled: false, group, map }), false);
	assert.deepEqual(calls, ["addTo"]);
});

test("shouldUpdateAutoChartLayer requires a loaded map and visible Auto Charts group", () => {
	const group = fakeGroup();
	const map = {
		_loaded: false,
		hasLayer: () => true,
	};
	assert.equal(shouldUpdateAutoChartLayer({ group, map }), false);
	map._loaded = true;
	assert.equal(shouldUpdateAutoChartLayer({ group, map }), true);
	map.hasLayer = () => false;
	assert.equal(shouldUpdateAutoChartLayer({ group, map }), false);
});

test("createAutoChartChooser chooses from map zoom and supplied position", () => {
	const chartList = [
		{
			__autoChartId: "chart",
			bounds: { west: -5, south: 53, east: -4, north: 54 },
			minzoom: 3,
			maxzoom: 12,
		},
	];
	const chooser = createAutoChartChooser({
		chartList,
		getPosition: () => ({ lat: 53.5, lng: -4.5 }),
		map: {
			getMaxZoom: () => 18,
			getZoom: () => 9,
		},
	});

	assert.equal(chooser()?.__autoChartId, "chart");
});

test("createAutoChartLayerMaker delegates to the established Leaflet layer factory", () => {
	let config;
	const expectedLayer = {
		addTo() {},
		remove() {},
	};
	const maker = createAutoChartLayerMaker({
		L: {
			tileLayer(url, options) {
				config = { url, options };
				return expectedLayer;
			},
		},
		labelRules: ["labels"],
		paintRules: ["paint"],
		protomapsL: {},
	});

	assert.equal(maker({ url: "/chart/{z}/{x}/{y}.png" }), expectedLayer);
	assert.equal(config.url, "/chart/{z}/{x}/{y}.png");
	assert.equal(config.options.zIndex, 650);
});

test("createAutoChartControllerParts builds the chart controller wiring bundle", () => {
	const group = {};
	const parts = createAutoChartControllerParts({
		L: {
			layerGroup: () => group,
			tileLayer: () => ({ addTo() {}, chartLayer: true, remove() {} }),
		},
		chartList: [
			{
				__autoChartId: "chart",
				bounds: { west: -5, south: 53, east: -4, north: 54 },
				minzoom: 3,
				maxzoom: 12,
				url: "/chart/{z}/{x}/{y}.png",
			},
		],
		getPosition: () => ({ lat: 53.5, lng: -4.5 }),
		labelRules: [],
		map: {
			getMaxZoom: () => 18,
			getZoom: () => 9,
		},
		paintRules: [],
		protomapsL: {},
	});

	assert.equal(parts.group, group);
	assert.equal(parts.layerState.chartId, null);
	assert.equal(parts.layerState.chartLayer, null);
	assert.equal(parts.chooseChart()?.__autoChartId, "chart");
	assert.equal(parts.makeChartLayer({ url: "/chart/{z}/{x}/{y}.png" })?.chartLayer, true);
});
