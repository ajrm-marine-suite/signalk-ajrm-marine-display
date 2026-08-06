import assert from "node:assert/strict";
import test from "node:test";
import { createAutoChartController } from "../src/web/assets/scripts/auto-chart-controller.mjs";

function fakeLayerGroup(calls) {
	const layers = new Set();
	return {
		addTo(map) {
			calls.push("group:addTo");
			map.layers.add(this);
		},
		addLayer(layer) {
			calls.push(`group:addLayer:${layer.name}`);
			layers.add(layer);
		},
		clearLayers() {
			calls.push("group:clearLayers");
			layers.clear();
		},
		eachLayer(callback) {
			for (const layer of layers) callback(layer);
		},
		hasLayer(layer) {
			return layers.has(layer);
		},
		removeFrom(map) {
			calls.push("group:removeFrom");
			map.layers.delete(this);
		},
	};
}

test("createAutoChartController stores Auto Charts toggle state through injected storage", async () => {
	const calls = [];
	const stored = new Map();
	const controller = createAutoChartController({
		L: {
			layerGroup: () => fakeLayerGroup(calls),
		},
		protomapsL: {},
		map: {
			layers: new Set(),
			hasLayer(layer) {
				return this.layers.has(layer);
			},
		},
		charts: {},
		paintRules: [],
		labelRules: [],
		openSeaMap: null,
		getPosition: () => ({ lat: 0, lng: 0 }),
		storage: {
			setItem(key, value) {
				stored.set(key, value);
			},
		},
	});

	await controller.toggle(false);

	assert.equal(controller.enabled, false);
	assert.equal(stored.get("checkAutoCharts"), "false");
	assert.deepEqual(calls, ["group:clearLayers"]);
});

test("createAutoChartController refreshes startup chart resources without rebuilding the controller", async () => {
	const calls = [];
	let chartResources = {};
	const controller = createAutoChartController({
		L: {
			layerGroup: () => fakeLayerGroup(calls),
			tileLayer(url) {
				calls.push(`tileLayer:${url}`);
				return {
					name: url,
					addTo() {},
					remove() {},
				};
			},
		},
		protomapsL: {},
		map: {
			_loaded: true,
			layers: new Set(),
			getMaxZoom: () => 22,
			getZoom: () => 12,
			hasLayer(layer) {
				return this.layers.has(layer);
			},
		},
		charts: {},
		paintRules: [],
		labelRules: [],
		openSeaMap: null,
		getPosition: () => ({ lat: 56.2, lng: -5.55 }),
		loadCharts: async () => chartResources,
	});

	controller.update();
	assert.equal(
		calls.includes("tileLayer:/charts/craobh/{z}/{x}/{y}.png"),
		false,
	);

	chartResources = {
		craobh: {
			bounds: [-5.7, 56.1, -5.4, 56.3],
			minzoom: 0,
			maxzoom: 18,
			tilemapUrl: "/charts/craobh/{z}/{x}/{y}.png",
		},
	};

	assert.equal(await controller.refreshCharts(), true);
	controller.update();

	assert.equal(
		calls.includes("tileLayer:/charts/craobh/{z}/{x}/{y}.png"),
		true,
	);
	assert.equal(await controller.refreshCharts(), false);
});

test("createAutoChartController ignores failed chart resource refreshes", async () => {
	const controller = createAutoChartController({
		L: {
			layerGroup: () => fakeLayerGroup([]),
		},
		protomapsL: {},
		map: {
			layers: new Set(),
			hasLayer(layer) {
				return this.layers.has(layer);
			},
		},
		charts: {},
		paintRules: [],
		labelRules: [],
		openSeaMap: null,
		getPosition: () => ({ lat: 0, lng: 0 }),
		loadCharts: async () => {
			throw new Error("provider warming up");
		},
	});

	assert.equal(await controller.refreshCharts(), false);
});

test("chart cycling locks each overlapping chart, returns to Auto, and releases outside coverage", () => {
	const calls = [];
	let position = { lat: 56.2585, lng: -5.6236 };
	let zoom = 16;
	const controller = createAutoChartController({
		L: {
			layerGroup: () => fakeLayerGroup(calls),
			tileLayer(url) {
				calls.push(`tileLayer:${url}`);
				return { name: url, addTo() {}, remove() {} };
			},
		},
		protomapsL: {},
		map: {
			_loaded: true,
			layers: new Set(),
			getMaxZoom: () => 22,
			getZoom: () => zoom,
			hasLayer(layer) {
				return this.layers.has(layer);
			},
		},
		charts: {
			detail: {
				name: "Detailed Cuan",
				bounds: [-5.64, 56.25, -5.61, 56.27],
				minzoom: 13,
				maxzoom: 18,
				tilemapUrl: "/detail/{z}/{x}/{y}.png",
			},
			alternate: {
				name: "Alternate Cuan",
				bounds: [-5.65, 56.24, -5.6, 56.28],
				minzoom: 13,
				maxzoom: 18,
				tilemapUrl: "/alternate/{z}/{x}/{y}.png",
			},
		},
		paintRules: [],
		labelRules: [],
		openSeaMap: null,
		getPosition: () => position,
	});

	controller.update();
	assert.equal(calls.at(-1), "group:addLayer:/detail/{z}/{x}/{y}.png");

	const manual = controller.cycleChart();
	assert.deepEqual(
		{ mode: manual.mode, index: manual.index, total: manual.total },
		{ mode: "manual", index: 2, total: 2 },
	);
	assert.equal(controller.manualChartId, "alternate");

	zoom = 22;
	controller.update();
	assert.equal(controller.manualChartId, "alternate");

	const automatic = controller.cycleChart();
	assert.equal(automatic.mode, "auto");
	assert.equal(controller.manualChartId, null);

	controller.cycleChart();
	position = { lat: 57, lng: -5.6236 };
	controller.update();
	assert.equal(controller.manualChartId, null);
});
