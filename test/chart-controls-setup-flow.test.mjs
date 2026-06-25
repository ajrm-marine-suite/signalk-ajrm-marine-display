import assert from "node:assert/strict";
import test from "node:test";
import {
	attachChartSelectorControl,
	createConfiguredChartToolbar,
	createConfiguredChartLayerController,
	createChartLayerControllerWithDiagnostics,
	createChartLayerSetupStep,
	applyConfiguredChartStartup,
	chartLayerSetupStepConfig,
	chartSelectorSetupStepConfig,
	chartStartupSetupStepConfig,
	chartToolbarSetupStepConfig,
	createConfiguredChartSelectorControl,
	createChartSelectorWithDiagnostics,
	createChartSelectorSetupStep,
	createChartToolbarSetupStep,
	createChartToolbarWithDiagnostics,
	applyChartStartupWithDiagnostics,
	applyChartStartupSetupStep,
	runConfiguredChartControlSetup,
} from "../src/web/assets/scripts/chart-controls-setup-flow.mjs";

function createDiagnostics() {
	const entries = [];
	return {
		entries,
		record(step, details) {
			entries.push({ step, details });
		},
		error(step, error) {
			entries.push({ step, error });
		},
	};
}

test("createChartLayerControllerWithDiagnostics creates the layer controller and records the step", () => {
	const diagnostics = createDiagnostics();
	const config = {
		map: { name: "map" },
		baseMaps: { Base: {} },
		overlayMaps: { Overlay: {} },
		autoCharts: { name: "auto" },
		displaySettings: { name: "settings" },
		storage: { name: "storage" },
		diagnostics,
		createLayerController(received) {
			assert.equal(received.map, config.map);
			assert.equal(received.baseMaps, config.baseMaps);
			assert.equal(received.overlayMaps, config.overlayMaps);
			assert.equal(received.autoCharts, config.autoCharts);
			assert.equal(received.displaySettings, config.displaySettings);
			assert.equal(received.storage, config.storage);
			return { name: "controller" };
		},
	};

	const controller = createChartLayerControllerWithDiagnostics(config);

	assert.equal(controller.name, "controller");
	assert.deepEqual(
		diagnostics.entries.map((entry) => entry.step),
		["chart-controls:layer-controller-created"],
	);
});

test("layer controller action helper creates without recording diagnostics", () => {
	const config = {
		map: { name: "map" },
		baseMaps: { Base: {} },
		overlayMaps: { Overlay: {} },
		autoCharts: { name: "auto" },
		displaySettings: { name: "settings" },
		storage: { name: "storage" },
		createLayerController(received) {
			assert.equal(received.map, config.map);
			assert.equal(received.baseMaps, config.baseMaps);
			assert.equal(received.overlayMaps, config.overlayMaps);
			assert.equal(received.autoCharts, config.autoCharts);
			assert.equal(received.displaySettings, config.displaySettings);
			assert.equal(received.storage, config.storage);
			return { name: "controller" };
		},
	};

	const controller = createConfiguredChartLayerController(config);

	assert.equal(controller.name, "controller");
});

test("createChartSelectorWithDiagnostics creates, attaches and records the selector steps", () => {
	const diagnostics = createDiagnostics();
	const calls = [];
	const map = {
		name: "map",
		hasLayer(layer) {
			calls.push(`hasLayer:${layer.name}`);
			return layer.name === "Overlay";
		},
	};
	const chartLayerController = {
		selectBaseLayer: () => "select",
		setOverlayLayer: () => "overlay",
		setChartSelectorControl(selector) {
			calls.push(`setSelector:${selector.name}`);
		},
	};
	const selector = {
		name: "selector",
		control: {
			addTo(targetMap) {
				calls.push(`addTo:${targetMap.name}`);
			},
		},
	};

	const returned = createChartSelectorWithDiagnostics({
		L: { name: "leaflet" },
		map,
		baseMaps: { Base: { name: "Base" } },
		overlayMaps: { Overlay: { name: "Overlay" } },
		autoCharts: { name: "auto" },
		chartLayerController,
		escapeHtml: (value) => value,
		storage: { getItem: () => null },
		diagnostics,
		createSelector(config) {
			calls.push("createSelector");
			assert.equal(config.getBaseLayerName(), null);
			assert.equal(config.isOverlayEnabled("Overlay"), true);
			assert.equal(config.onSelectBaseLayer(), "select");
			assert.equal(config.onSetOverlayLayer(), "overlay");
			return selector;
		},
	});

	assert.equal(returned, selector);
	assert.deepEqual(calls, [
		"createSelector",
		"hasLayer:Overlay",
		"setSelector:selector",
		"addTo:map",
	]);
	assert.deepEqual(
		diagnostics.entries.map((entry) => entry.step),
		["chart-controls:selector-created", "chart-controls:selector-added"],
	);
});

test("selector action helpers create and attach without recording diagnostics", () => {
	const calls = [];
	const map = {
		name: "map",
		hasLayer(layer) {
			calls.push(`hasLayer:${layer.name}`);
			return true;
		},
	};
	const chartLayerController = {
		selectBaseLayer: () => "select",
		setOverlayLayer: () => "overlay",
		setChartSelectorControl(selector) {
			calls.push(`setSelector:${selector.name}`);
		},
	};
	const selector = {
		name: "selector",
		control: {
			addTo(targetMap) {
				calls.push(`addTo:${targetMap.name}`);
			},
		},
	};

	const created = createConfiguredChartSelectorControl({
		L: { name: "leaflet" },
		map,
		baseMaps: { Base: { name: "Base" } },
		overlayMaps: { Overlay: { name: "Overlay" } },
		autoCharts: { name: "auto" },
		chartLayerController,
		escapeHtml: (value) => value,
		storage: { getItem: () => null },
		createSelector(config) {
			calls.push("createSelector");
			assert.equal(config.isOverlayEnabled("Overlay"), true);
			return selector;
		},
	});
	attachChartSelectorControl({
		map,
		chartLayerController,
		chartSelectorControl: created,
	});

	assert.equal(created, selector);
	assert.deepEqual(calls, [
		"createSelector",
		"hasLayer:Overlay",
		"setSelector:selector",
		"addTo:map",
	]);
});

test("toolbar and startup helpers preserve their factory calls and diagnostics", () => {
	const diagnostics = createDiagnostics();
	const calls = [];
	const map = { name: "map" };
	const chartLayerController = { name: "controller" };

	createChartToolbarWithDiagnostics({
		createToolbar(config) {
			calls.push(`toolbar:${config.map.name}`);
		},
		map,
		easyButton: { name: "easyButton" },
		offcanvas: { name: "offcanvas" },
		document: { name: "document" },
		diagnostics,
	});
	applyChartStartupWithDiagnostics({
		applyStartup(config) {
			calls.push(`startup:${config.map.name}`);
			assert.equal(config.chartLayerController, chartLayerController);
		},
		map,
		baseMaps: { Base: {} },
		overlayMaps: { Overlay: {} },
		autoCharts: { name: "auto" },
		chartLayerController,
		displaySettings: { name: "settings" },
		storage: { name: "storage" },
		diagnostics,
	});

	assert.deepEqual(calls, ["toolbar:map", "startup:map"]);
	assert.deepEqual(
		diagnostics.entries.map((entry) => entry.step),
		["chart-controls:toolbar-created", "chart-controls:startup-applied"],
	);
});

test("toolbar and startup action helpers run factories without recording diagnostics", () => {
	const calls = [];
	const map = { name: "map" };
	const chartLayerController = { name: "controller" };

	createConfiguredChartToolbar({
		createToolbar(config) {
			calls.push(`toolbar:${config.map.name}`);
			assert.equal(config.easyButton.name, "easyButton");
		},
		map,
		easyButton: { name: "easyButton" },
		offcanvas: { name: "offcanvas" },
		document: { name: "document" },
	});
	applyConfiguredChartStartup({
		applyStartup(config) {
			calls.push(`startup:${config.map.name}`);
			assert.equal(config.chartLayerController, chartLayerController);
			assert.equal(config.diagnostics.name, "diagnostics");
		},
		map,
		baseMaps: { Base: {} },
		overlayMaps: { Overlay: {} },
		autoCharts: { name: "auto" },
		chartLayerController,
		displaySettings: { name: "settings" },
		storage: { name: "storage" },
		diagnostics: { name: "diagnostics" },
	});

	assert.deepEqual(calls, ["toolbar:map", "startup:map"]);
});

test("chart setup step helpers delegate without changing the startup arguments", () => {
	const diagnostics = createDiagnostics();
	const calls = [];
	const map = { name: "map" };
	const chartLayerController = createChartLayerSetupStep({
		createLayerController(config) {
			calls.push(`layer:${config.map.name}`);
			return {
				name: "controller",
				setChartSelectorControl(selector) {
					calls.push(`setSelector:${selector.name}`);
				},
			};
		},
		map,
		baseMaps: { Base: {} },
		overlayMaps: { Overlay: {} },
		autoCharts: { name: "auto" },
		displaySettings: { name: "settings" },
		storage: { name: "storage" },
		diagnostics,
	});

	const chartSelectorControl = createChartSelectorSetupStep({
		L: { name: "leaflet" },
		map,
		baseMaps: { Base: {} },
		overlayMaps: { Overlay: {} },
		autoCharts: { name: "auto" },
		chartLayerController,
		escapeHtml: (value) => value,
		storage: { getItem: () => null },
		diagnostics,
		createSelector(config) {
			calls.push(`selector:${config.map.name}`);
			return { name: "selector", control: { addTo() {} } };
		},
	});

	createChartToolbarSetupStep({
		createToolbar(config) {
			calls.push(`toolbar:${config.map.name}`);
		},
		map,
		easyButton: {},
		offcanvas: {},
		document: {},
		diagnostics,
	});
	applyChartStartupSetupStep({
		applyStartup(config) {
			calls.push(`startup:${config.map.name}`);
		},
		map,
		baseMaps: { Base: {} },
		overlayMaps: { Overlay: {} },
		autoCharts: { name: "auto" },
		chartLayerController,
		displaySettings: { name: "settings" },
		storage: { name: "storage" },
		diagnostics,
	});

	assert.equal(chartLayerController.name, "controller");
	assert.equal(chartSelectorControl.name, "selector");
	assert.deepEqual(calls, [
		"layer:map",
		"selector:map",
		"setSelector:selector",
		"toolbar:map",
		"startup:map",
	]);
});

test("chart setup config helpers keep step argument bundles explicit", () => {
	const map = { name: "map" };
	const chartLayerController = { name: "controller" };
		const common = {
			map,
			baseMaps: { Base: {} },
			overlayMaps: { Overlay: {} },
			autoCharts: { name: "auto" },
			harbourDisplay: { name: "harbours" },
			displaySettings: { name: "settings" },
			storage: { name: "storage" },
			diagnostics: { name: "diagnostics" },
		};
	const createLayerController = () => {};
	const createSelector = () => {};
	const createToolbar = () => {};
	const applyStartup = () => {};
	const escapeHtml = (value) => value;

	assert.deepEqual(
		chartLayerSetupStepConfig({ ...common, createLayerController }),
		{ ...common, createLayerController },
	);
	assert.deepEqual(
		chartSelectorSetupStepConfig({
			L: { name: "leaflet" },
			map,
				baseMaps: common.baseMaps,
				overlayMaps: common.overlayMaps,
				autoCharts: common.autoCharts,
				harbourDisplay: common.harbourDisplay,
				chartLayerController,
				escapeHtml,
				storage: common.storage,
			createSelector,
			diagnostics: common.diagnostics,
		}),
		{
			L: { name: "leaflet" },
			map,
				baseMaps: common.baseMaps,
				overlayMaps: common.overlayMaps,
				autoCharts: common.autoCharts,
				harbourDisplay: common.harbourDisplay,
				chartLayerController,
				escapeHtml,
				storage: common.storage,
			createSelector,
			diagnostics: common.diagnostics,
		},
	);
	assert.deepEqual(
		chartToolbarSetupStepConfig({
			createToolbar,
			map,
			easyButton: { name: "easy" },
			offcanvas: { name: "offcanvas" },
			document: { name: "document" },
			diagnostics: common.diagnostics,
		}),
		{
			createToolbar,
			map,
			easyButton: { name: "easy" },
			offcanvas: { name: "offcanvas" },
			document: { name: "document" },
			diagnostics: common.diagnostics,
		},
	);
	assert.deepEqual(
		chartStartupSetupStepConfig({
			...common,
			chartLayerController,
			applyStartup,
		}),
		{ ...common, chartLayerController, applyStartup },
	);
});

test("runConfiguredChartControlSetup preserves startup order and error diagnostics", () => {
	const diagnostics = createDiagnostics();
	const calls = [];
	const map = {
		name: "map",
		hasLayer(layer) {
			calls.push(`hasLayer:${layer.name}`);
			return false;
		},
	};
	const chartLayerController = {
		selectBaseLayer: () => {},
		setOverlayLayer: () => {},
		setChartSelectorControl(selector) {
			calls.push(`setSelector:${selector.name}`);
		},
	};
	const chartSelectorControl = {
		name: "selector",
		control: {
			addTo(targetMap) {
				calls.push(`addTo:${targetMap.name}`);
			},
		},
	};

	const result = runConfiguredChartControlSetup({
		L: { name: "leaflet" },
		map,
		easyButton: { name: "easy" },
		offcanvas: { name: "offcanvas" },
		document: { name: "document" },
		baseMaps: { Base: { name: "Base" } },
		overlayMaps: { Overlay: { name: "Overlay" } },
		autoCharts: { name: "auto" },
		displaySettings: { name: "settings" },
		escapeHtml: (value) => value,
		storage: { getItem: () => null },
		diagnostics,
		createLayerController() {
			calls.push("layer");
			return chartLayerController;
		},
		createSelector() {
			calls.push("selector");
			return chartSelectorControl;
		},
		createToolbar() {
			calls.push("toolbar");
		},
		applyStartup() {
			calls.push("startup");
		},
	});

	assert.equal(result.chartLayerController, chartLayerController);
	assert.equal(result.chartSelectorControl, chartSelectorControl);
	assert.deepEqual(calls, [
		"layer",
		"selector",
		"setSelector:selector",
		"addTo:map",
		"toolbar",
		"startup",
	]);
	assert.deepEqual(
		diagnostics.entries.map((entry) => entry.step),
		[
			"chart-controls:layer-controller-created",
			"chart-controls:selector-created",
			"chart-controls:selector-added",
			"chart-controls:toolbar-created",
			"chart-controls:startup-applied",
		],
	);

	const failedDiagnostics = createDiagnostics();
	assert.throws(
		() =>
			runConfiguredChartControlSetup({
				L: {},
				map,
				easyButton: {},
				offcanvas: {},
				document: {},
				baseMaps: {},
				overlayMaps: {},
				autoCharts: {},
				displaySettings: {},
				escapeHtml: (value) => value,
				storage: {},
				diagnostics: failedDiagnostics,
				createLayerController() {
					throw new Error("boom");
				},
				createSelector() {},
				createToolbar() {},
				applyStartup() {},
			}),
		/boom/,
	);
	assert.equal(failedDiagnostics.entries.at(-1).step, "chart-controls:error");
});
