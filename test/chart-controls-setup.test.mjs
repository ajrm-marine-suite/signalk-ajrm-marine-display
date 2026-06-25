import assert from "node:assert/strict";
import test from "node:test";
import {
	chartControlFactoryBundle,
	chartControlSetupContext,
	chartControlSetupResult,
	configuredChartControlSetupRunConfig,
	createConfiguredChartControls,
	createOverlayMaps,
} from "../src/web/assets/scripts/chart-controls-setup.mjs";

test("chartControlSetupResult keeps the setup return shape stable", () => {
	const chartLayerController = { name: "controller" };
	const chartSelectorControl = { name: "selector" };
	const overlayMaps = { OpenSeaMap: {} };

	assert.deepEqual(
		chartControlSetupResult({
			chartLayerController,
			chartSelectorControl,
			overlayMaps,
		}),
		{ chartLayerController, chartSelectorControl, overlayMaps },
	);
});

test("createOverlayMaps preserves the OpenSeaMap and Auto Charts overlay names", () => {
	const openSeaMap = { name: "OpenSeaMap" };
	const autoCharts = { group: { name: "Auto Charts" } };
	const harbourDisplay = { layer: { name: "Harbour Limits" } };

	assert.deepEqual(createOverlayMaps({ openSeaMap, autoCharts, harbourDisplay }), {
		OpenSeaMap: openSeaMap,
		"Auto Charts": autoCharts.group,
		"Harbour Limits": harbourDisplay.layer,
	});
});

test("configuredChartControlSetupRunConfig preserves the run setup dependencies", () => {
	const config = {
		L: { name: "leaflet" },
		map: { name: "map" },
		easyButton: { name: "easyButton" },
		offcanvas: { name: "offcanvas" },
		document: { name: "document" },
		baseMaps: { Base: {} },
		overlayMaps: { Overlay: {} },
		autoCharts: { name: "auto" },
		harbourDisplay: { name: "harbours" },
		displaySettings: { name: "settings" },
		escapeHtml: (value) => value,
		storage: { name: "storage" },
		diagnostics: { name: "diagnostics" },
		createLayerController: () => {},
		createSelector: () => {},
		createToolbar: () => {},
		applyStartup: () => {},
	};

	assert.deepEqual(configuredChartControlSetupRunConfig(config), config);
});

test("chart control setup context and factory bundles combine into run config", () => {
	const context = chartControlSetupContext({
		L: { name: "leaflet" },
		map: { name: "map" },
		easyButton: { name: "easy" },
		offcanvas: { name: "offcanvas" },
		document: { name: "document" },
		baseMaps: { Base: {} },
		overlayMaps: { Overlay: {} },
		autoCharts: { name: "auto" },
		harbourDisplay: { name: "harbours" },
		displaySettings: { name: "settings" },
		escapeHtml: (value) => value,
		storage: { name: "storage" },
		diagnostics: { name: "diagnostics" },
	});
	const factoryBundle = chartControlFactoryBundle({
		createLayerController() {},
		createSelector() {},
		createToolbar() {},
		applyStartup() {},
	});
	const config = configuredChartControlSetupRunConfig({ context, factoryBundle });

	assert.equal(config.map.name, "map");
	assert.equal(config.baseMaps, context.baseMaps);
	assert.equal(config.createSelector, factoryBundle.createSelector);
	assert.equal(config.applyStartup, factoryBundle.applyStartup);
});

test("createConfiguredChartControls wires selector, toolbar and startup in order", () => {
	const storage = {
		getItem() {
			return null;
		},
		setItem() {},
	};
	const calls = [];
	const map = {
		name: "map",
		hasLayer(layer) {
			calls.push(`hasLayer:${layer.name}`);
			return layer.name === "OpenSeaMap";
		},
	};
	const baseMaps = {
		"NaturalEarth (offline)": { name: "NaturalEarth (offline)" },
	};
	const openSeaMap = { name: "OpenSeaMap" };
	const autoCharts = {
		enabled: true,
		group: { name: "Auto Charts" },
	};
	const harbourDisplay = {
		layer: { name: "Harbour Limits" },
		isEnabled: () => true,
	};
	const displaySettings = { name: "displaySettings" };
	const diagnosticEntries = [];
	const diagnostics = {
		record(step, details) {
			diagnosticEntries.push({ step, details });
		},
		error(step, error) {
			diagnosticEntries.push({ step, error });
		},
	};
	const chartLayerController = {
		selectBaseLayer: () => "selectBaseLayer",
		setOverlayLayer: () => "setOverlayLayer",
		setChartSelectorControl(selector) {
			calls.push(`setSelector:${selector.name}`);
		},
	};
	const selectorControl = {
		name: "selector",
		control: {
			addTo(targetMap) {
				calls.push(`selectorAddTo:${targetMap.name}`);
			},
		},
	};
	const returned = createConfiguredChartControls({
		L: { name: "leaflet" },
		map,
		easyButton: { name: "easyButton" },
		offcanvas: { name: "offcanvas" },
		document: { name: "document" },
		baseMaps,
		openSeaMap,
		autoCharts,
		harbourDisplay,
		displaySettings,
		escapeHtml: (value) => value,
		storage,
		diagnostics,
		factories: {
			createChartLayerController: (config) => {
				calls.push("createLayerController");
				assert.equal(config.map, map);
				assert.equal(config.baseMaps, baseMaps);
				assert.deepEqual(config.overlayMaps, {
					OpenSeaMap: openSeaMap,
					"Auto Charts": autoCharts.group,
					"Harbour Limits": harbourDisplay.layer,
				});
				assert.equal(config.autoCharts, autoCharts);
				assert.equal(config.harbourDisplay, harbourDisplay);
				assert.equal(config.displaySettings, displaySettings);
				assert.equal(config.storage, storage);
				return chartLayerController;
			},
			createChartSelectorControl: (config) => {
				calls.push("createSelector");
				assert.equal(config.L.name, "leaflet");
				assert.equal(config.map, map);
				assert.equal(config.baseMaps, baseMaps);
				assert.equal(config.overlayMaps.OpenSeaMap, openSeaMap);
				assert.equal(config.overlayMaps["Auto Charts"], autoCharts.group);
				assert.equal(config.overlayMaps["Harbour Limits"], harbourDisplay.layer);
				assert.equal(config.getBaseLayerName(), null);
				assert.equal(config.isOverlayEnabled("Auto Charts"), true);
				assert.equal(config.isOverlayEnabled("Harbour Limits"), true);
				assert.equal(config.isOverlayEnabled("OpenSeaMap"), true);
				assert.equal(config.onSelectBaseLayer(), "selectBaseLayer");
				assert.equal(config.onSetOverlayLayer(), "setOverlayLayer");
				assert.equal(config.escapeHtml("x"), "x");
				return selectorControl;
			},
			createMapToolbarButtons: (config) => {
				calls.push("createToolbar");
				assert.equal(config.map, map);
				assert.equal(config.easyButton.name, "easyButton");
				assert.equal(config.offcanvas.name, "offcanvas");
				assert.equal(config.document.name, "document");
			},
			applyChartStartup: (config) => {
				calls.push("applyStartup");
				assert.equal(config.map, map);
				assert.equal(config.baseMaps, baseMaps);
				assert.equal(config.overlayMaps.OpenSeaMap, openSeaMap);
				assert.equal(config.overlayMaps["Auto Charts"], autoCharts.group);
				assert.equal(config.overlayMaps["Harbour Limits"], harbourDisplay.layer);
				assert.equal(config.autoCharts, autoCharts);
				assert.equal(config.harbourDisplay, harbourDisplay);
				assert.equal(config.chartLayerController, chartLayerController);
				assert.equal(config.displaySettings, displaySettings);
				assert.equal(config.storage, storage);
				assert.equal(config.diagnostics, diagnostics);
			},
		},
	});

	assert.equal(returned.chartLayerController, chartLayerController);
	assert.equal(returned.chartSelectorControl, selectorControl);
	assert.deepEqual(returned.overlayMaps, {
		OpenSeaMap: openSeaMap,
		"Auto Charts": autoCharts.group,
		"Harbour Limits": harbourDisplay.layer,
	});
	assert.deepEqual(calls, [
		"createLayerController",
		"createSelector",
		"hasLayer:OpenSeaMap",
		"setSelector:selector",
		"selectorAddTo:map",
		"createToolbar",
		"applyStartup",
	]);
	assert.deepEqual(
		diagnosticEntries.map((entry) => entry.step),
		[
			"chart-controls:start",
			"chart-controls:layer-controller-created",
			"chart-controls:selector-created",
			"chart-controls:selector-added",
			"chart-controls:toolbar-created",
			"chart-controls:startup-applied",
		],
	);
});
