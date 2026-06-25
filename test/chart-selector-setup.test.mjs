import assert from "node:assert/strict";
import test from "node:test";
import {
	AUTO_CHARTS_OVERLAY_NAME,
	HARBOUR_LIMITS_OVERLAY_NAME,
} from "../src/web/assets/scripts/chart-layer-overlay-actions.mjs";
import {
	chartSelectorBaseLayerGetter,
	chartSelectorOverlayEnabledGetter,
	chartSelectorSetupConfig,
	createConfiguredChartSelector,
} from "../src/web/assets/scripts/chart-selector-setup.mjs";

test("chart selector setup helpers preserve storage and overlay lookups", () => {
	const calls = [];
	const storage = {
		getItem(key) {
			calls.push(`get:${key}`);
			return "NaturalEarth (offline)";
		},
	};
	const openSeaMap = { name: "OpenSeaMap" };
	const map = {
		hasLayer(layer) {
			calls.push(`hasLayer:${layer.name}`);
			return layer === openSeaMap;
		},
	};
	const getBaseLayerName = chartSelectorBaseLayerGetter({ storage });
	const isOverlayEnabled = chartSelectorOverlayEnabledGetter({
		autoCharts: { enabled: true },
		harbourDisplay: { isEnabled: () => false },
		map,
		overlayMaps: {
			OpenSeaMap: openSeaMap,
			[AUTO_CHARTS_OVERLAY_NAME]: { name: AUTO_CHARTS_OVERLAY_NAME },
			[HARBOUR_LIMITS_OVERLAY_NAME]: { name: HARBOUR_LIMITS_OVERLAY_NAME },
		},
	});

	assert.equal(getBaseLayerName(), "NaturalEarth (offline)");
	assert.equal(isOverlayEnabled(AUTO_CHARTS_OVERLAY_NAME), true);
	assert.equal(isOverlayEnabled(HARBOUR_LIMITS_OVERLAY_NAME), false);
	assert.equal(isOverlayEnabled("OpenSeaMap"), true);
	assert.deepEqual(calls, ["get:baselayer", "hasLayer:OpenSeaMap"]);
});

test("chartSelectorSetupConfig keeps selector factory inputs explicit", () => {
	const chartLayerController = {
		selectBaseLayer: () => "selected",
		setOverlayLayer: () => "overlay",
	};
	const config = chartSelectorSetupConfig({
		L: { name: "leaflet" },
		map: { hasLayer: () => false },
		baseMaps: { Base: {} },
		overlayMaps: { Overlay: {} },
		autoCharts: { enabled: false },
		harbourDisplay: { isEnabled: () => true },
		chartLayerController,
		escapeHtml: (value) => value,
		storage: { getItem: () => "Base" },
	});

	assert.equal(config.L.name, "leaflet");
	assert.deepEqual(config.baseMaps, { Base: {} });
	assert.equal(config.getBaseLayerName(), "Base");
	assert.equal(config.isOverlayEnabled(AUTO_CHARTS_OVERLAY_NAME), false);
	assert.equal(config.isOverlayEnabled(HARBOUR_LIMITS_OVERLAY_NAME), true);
	assert.equal(config.onSelectBaseLayer(), "selected");
	assert.equal(config.onSetOverlayLayer(), "overlay");
});

test("createConfiguredChartSelector wires stored base layer and overlay state", () => {
	const calls = [];
	const map = {
		name: "map",
		hasLayer(layer) {
			calls.push(`hasLayer:${layer.name}`);
			return layer.name === "OpenSeaMap";
		},
	};
	const storage = {
		getItem(key) {
			calls.push(`get:${key}`);
			return key === "baselayer" ? "NaturalEarth (offline)" : null;
		},
	};
	const baseMaps = {
		"NaturalEarth (offline)": { name: "NaturalEarth (offline)" },
	};
	const overlayMaps = {
		OpenSeaMap: { name: "OpenSeaMap" },
		"Auto Charts": { name: "Auto Charts" },
		"Harbour Limits": { name: "Harbour Limits" },
	};
	const autoCharts = { enabled: true };
	const harbourDisplay = { isEnabled: () => true };
	const chartLayerController = {
		selectBaseLayer: () => "selected",
		setOverlayLayer: () => "overlay",
	};
	const selector = { name: "selector" };

	const result = createConfiguredChartSelector({
		L: { name: "leaflet" },
		map,
		baseMaps,
		overlayMaps,
		autoCharts,
		harbourDisplay,
		chartLayerController,
		escapeHtml: (value) => `safe:${value}`,
		storage,
		createSelector(config) {
			assert.equal(config.L.name, "leaflet");
			assert.equal(config.map, map);
			assert.equal(config.baseMaps, baseMaps);
			assert.equal(config.overlayMaps, overlayMaps);
			assert.equal(config.getBaseLayerName(), "NaturalEarth (offline)");
			assert.equal(config.isOverlayEnabled(AUTO_CHARTS_OVERLAY_NAME), true);
			assert.equal(config.isOverlayEnabled(HARBOUR_LIMITS_OVERLAY_NAME), true);
			assert.equal(config.isOverlayEnabled("OpenSeaMap"), true);
			assert.equal(config.onSelectBaseLayer(), "selected");
			assert.equal(config.onSetOverlayLayer(), "overlay");
			assert.equal(config.escapeHtml("x"), "safe:x");
			return selector;
		},
	});

	assert.equal(result, selector);
	assert.deepEqual(calls, ["get:baselayer", "hasLayer:OpenSeaMap"]);
});
