import assert from "node:assert/strict";
import test from "node:test";
import {
	applySelectedBaseLayer,
	applySelectedNormalOverlay,
	ensureLayerAdded,
	ensureLayerRemoved,
	isAutoChartsOverlay,
	isHarbourLimitsOverlay,
	isOpenSeaMapOverlay,
	refreshAutoChartsAfterBaseLayerChange,
	removeActiveBaseLayers,
} from "../src/web/assets/scripts/chart-layer-actions.mjs";
import { createChartLayerController } from "../src/web/assets/scripts/chart-layer-controller.mjs";

function fakeLayer(name) {
	return {
		name,
		addTo(map) {
			map.layers.add(this);
			map.calls.push(`add:${name}`);
			return this;
		},
	};
}

function fakeMap() {
	return {
		calls: [],
		layers: new Set(),
		hasLayer(layer) {
			return this.layers.has(layer);
		},
		removeLayer(layer) {
			this.layers.delete(layer);
			this.calls.push(`remove:${layer.name}`);
		},
	};
}

function fakeStorage() {
	const values = new Map();
	return {
		getItem(key) {
			return values.get(key) ?? null;
		},
		setItem(key, value) {
			values.set(key, value);
		},
		removeItem(key) {
			values.delete(key);
		},
	};
}

function fakeAutoCharts() {
	return {
		enabled: true,
		calls: [],
		resetFallback() {
			this.calls.push("resetFallback");
		},
		update() {
			this.calls.push("update");
		},
		keepOnTop() {
			this.calls.push("keepOnTop");
		},
		toggle(enabled) {
			this.calls.push(`toggle:${enabled}`);
			this.enabled = enabled;
		},
	};
}

function setup() {
	const empty = fakeLayer("Empty");
	const naturalEarth = fakeLayer("NaturalEarth");
	const openSeaMap = fakeLayer("OpenSeaMap");
	const autoChartsLayer = fakeLayer("Auto Charts");
	const harbourLayer = fakeLayer("Harbour Limits");
	const map = fakeMap();
	const storage = fakeStorage();
	const autoCharts = fakeAutoCharts();
	const displaySettings = {
		calls: [],
		applyColorMode() {
			this.calls.push("applyColorMode");
		},
	};
	const harbourDisplay = {
		calls: [],
		update(options) {
			this.calls.push(`update:${options.enabled}`);
		},
	};
	const selector = {
		updates: 0,
		update() {
			this.updates += 1;
		},
	};
	const controller = createChartLayerController({
		map,
		baseMaps: { Empty: empty, "NaturalEarth (offline)": naturalEarth },
		overlayMaps: {
			OpenSeaMap: openSeaMap,
			"Auto Charts": autoChartsLayer,
			"Harbour Limits": harbourLayer,
		},
		autoCharts,
		harbourDisplay,
		displaySettings,
		storage,
	});
	controller.setChartSelectorControl(selector);
	return {
		autoCharts,
		controller,
		displaySettings,
		empty,
		harbourDisplay,
		harbourLayer,
		map,
		naturalEarth,
		openSeaMap,
		selector,
		storage,
	};
}

test("removeActiveBaseLayers removes only currently active base layers", () => {
	const empty = fakeLayer("Empty");
	const naturalEarth = fakeLayer("NaturalEarth");
	const map = fakeMap();
	empty.addTo(map);

	removeActiveBaseLayers({
		map,
		baseMaps: { Empty: empty, NaturalEarth: naturalEarth },
	});

	assert.equal(map.hasLayer(empty), false);
	assert.equal(map.hasLayer(naturalEarth), false);
	assert.deepEqual(map.calls, ["add:Empty", "remove:Empty"]);
});

test("ensureLayerAdded adds only missing layers", () => {
	const layer = fakeLayer("OpenSeaMap");
	const map = fakeMap();

	ensureLayerAdded({ map, layer });
	ensureLayerAdded({ map, layer });

	assert.equal(map.hasLayer(layer), true);
	assert.deepEqual(map.calls, ["add:OpenSeaMap"]);
});

test("ensureLayerRemoved removes only present layers", () => {
	const layer = fakeLayer("OpenSeaMap");
	const map = fakeMap();
	layer.addTo(map);

	ensureLayerRemoved({ map, layer });
	ensureLayerRemoved({ map, layer });

	assert.equal(map.hasLayer(layer), false);
	assert.deepEqual(map.calls, ["add:OpenSeaMap", "remove:OpenSeaMap"]);
});

test("overlay name helpers identify the special chart overlays", () => {
	assert.equal(isAutoChartsOverlay("Auto Charts"), true);
	assert.equal(isAutoChartsOverlay("OpenSeaMap"), false);
	assert.equal(isOpenSeaMapOverlay("OpenSeaMap"), true);
	assert.equal(isOpenSeaMapOverlay("Auto Charts"), false);
	assert.equal(isHarbourLimitsOverlay("Harbour Limits"), true);
	assert.equal(isHarbourLimitsOverlay("OpenSeaMap"), false);
});

test("refreshAutoChartsAfterBaseLayerChange updates only when Auto Charts is enabled", () => {
	const enabled = fakeAutoCharts();
	refreshAutoChartsAfterBaseLayerChange(enabled);
	assert.deepEqual(enabled.calls, ["resetFallback", "update", "keepOnTop"]);

	const disabled = fakeAutoCharts();
	disabled.enabled = false;
	refreshAutoChartsAfterBaseLayerChange(disabled);
	assert.deepEqual(disabled.calls, []);
});

test("applySelectedBaseLayer swaps active base layers without changing storage", () => {
	const empty = fakeLayer("Empty");
	const naturalEarth = fakeLayer("NaturalEarth");
	const map = fakeMap();
	empty.addTo(map);

	applySelectedBaseLayer({
		map,
		baseMaps: { Empty: empty, NaturalEarth: naturalEarth },
		selectedLayer: naturalEarth,
	});

	assert.equal(map.hasLayer(empty), false);
	assert.equal(map.hasLayer(naturalEarth), true);
	assert.deepEqual(map.calls, ["add:Empty", "remove:Empty", "add:NaturalEarth"]);
});

test("applySelectedNormalOverlay adds and removes the chosen overlay", () => {
	const layer = fakeLayer("OpenSeaMap");
	const map = fakeMap();
	const calls = [];
	const handlers = {
		handleOverlayAdd: ({ name }) => calls.push(`add:${name}`),
		handleOverlayRemove: ({ name }) => calls.push(`remove:${name}`),
	};

	applySelectedNormalOverlay({
		map,
		selectedLayer: layer,
		name: "OpenSeaMap",
		enabled: true,
		...handlers,
	});
	applySelectedNormalOverlay({
		map,
		selectedLayer: layer,
		name: "OpenSeaMap",
		enabled: false,
		...handlers,
	});

	assert.equal(map.hasLayer(layer), false);
	assert.deepEqual(map.calls, ["add:OpenSeaMap", "remove:OpenSeaMap"]);
	assert.deepEqual(calls, ["add:OpenSeaMap", "remove:OpenSeaMap"]);
});

test("selectBaseLayer swaps the active base layer and persists the name", () => {
	const {
		autoCharts,
		controller,
		displaySettings,
		empty,
		map,
		naturalEarth,
		selector,
		storage,
	} = setup();
	empty.addTo(map);

	controller.selectBaseLayer("NaturalEarth (offline)");

	assert.equal(map.hasLayer(empty), false);
	assert.equal(map.hasLayer(naturalEarth), true);
	assert.equal(storage.getItem("baselayer"), "NaturalEarth (offline)");
	assert.deepEqual(autoCharts.calls, ["resetFallback", "update", "keepOnTop"]);
	assert.deepEqual(displaySettings.calls, ["applyColorMode"]);
	assert.equal(selector.updates, 1);
});

test("setOverlayLayer stores OpenSeaMap and keeps it above chart tiles", () => {
	const { autoCharts, controller, map, openSeaMap, storage } = setup();

	controller.setOverlayLayer("OpenSeaMap", true);

	assert.equal(map.hasLayer(openSeaMap), true);
	assert.equal(storage.getItem("overlay"), "OpenSeaMap");
	assert.deepEqual(autoCharts.calls, ["keepOnTop"]);
});

test("setOverlayLayer removes non-auto overlays from storage", () => {
	const { controller, map, openSeaMap, storage } = setup();
	openSeaMap.addTo(map);
	storage.setItem("overlay", "OpenSeaMap");

	controller.setOverlayLayer("OpenSeaMap", false);

	assert.equal(map.hasLayer(openSeaMap), false);
	assert.equal(storage.getItem("overlay"), null);
});

test("setOverlayLayer toggles Auto Charts without treating it as a stored overlay", () => {
	const { autoCharts, controller, storage } = setup();

	controller.setOverlayLayer("Auto Charts", false);

	assert.deepEqual(autoCharts.calls, ["toggle:false"]);
	assert.equal(storage.getItem("overlay"), null);
});

test("setOverlayLayer toggles harbour limits without using normal overlay storage", () => {
	const { controller, harbourDisplay, harbourLayer, map, storage } = setup();

	controller.setOverlayLayer("Harbour Limits", true);
	controller.setOverlayLayer("Harbour Limits", false);

	assert.equal(map.hasLayer(harbourLayer), false);
	assert.equal(storage.getItem("checkDisplayHarbours"), "false");
	assert.equal(storage.getItem("overlay"), null);
	assert.deepEqual(harbourDisplay.calls, ["update:true", "update:false"]);
});
