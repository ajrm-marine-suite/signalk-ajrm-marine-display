import assert from "node:assert/strict";
import test from "node:test";
import {
	addStartupOverlay,
	applyAutoChartsStartup,
	AUTO_CHART_RESOURCE_RETRY_DELAYS_MS,
	AUTO_CHART_STARTUP_UPDATE_DELAYS_MS,
	persistAndAddBaseLayer,
	refreshStartupUi,
	resolveChartStartupFromStorage,
	scheduleAutoChartResourceRefreshes,
	scheduleAutoChartUpdates,
	startupBaseLayer,
	startupOverlayLayer,
	storedChartStartupSettings,
} from "../src/web/assets/scripts/chart-startup-actions.mjs";
import { applyChartStartup } from "../src/web/assets/scripts/chart-startup-apply.mjs";

function fakeLayer(name, calls) {
	return {
		name,
		addTo(map) {
			calls.push(`add:${name}:${map.name}`);
			return this;
		},
	};
}

function fakeStorage(values = {}) {
	const store = new Map(Object.entries(values));
	return {
		getItem(key) {
			return store.get(key) ?? null;
		},
		setItem(key, value) {
			store.set(key, value);
		},
		value(key) {
			return store.get(key);
		},
	};
}

function setup({ startupState, storageValues } = {}) {
	const calls = [];
	const map = { name: "map" };
	const storage = fakeStorage(storageValues);
	const baseMaps = {
		Empty: fakeLayer("Empty", calls),
		"NaturalEarth (offline)": fakeLayer("NaturalEarth (offline)", calls),
	};
	const overlayMaps = {
		OpenSeaMap: fakeLayer("OpenSeaMap", calls),
		"Auto Charts": fakeLayer("Auto Charts", calls),
	};
	const autoCharts = {
		ensureVisible() {
			calls.push("autoCharts:ensureVisible");
		},
		toggle(enabled) {
			calls.push(`autoCharts:toggle:${enabled}`);
		},
		update() {
			calls.push("autoCharts:update");
		},
	};
	const chartLayerController = {
		updateChartSelectorControl() {
			calls.push("chartSelector:update");
		},
	};
	const displaySettings = {
		init() {
			calls.push("display:init");
		},
	};
	const diagnosticEntries = [];
	const diagnostics = {
		record(step, details) {
			diagnosticEntries.push({ step, details });
		},
		error(step, error) {
			diagnosticEntries.push({ step, error });
		},
	};
	const scheduled = [];
	const result = applyChartStartup({
		map,
		baseMaps,
		overlayMaps,
		autoCharts,
		chartLayerController,
		displaySettings,
		storage,
		schedule: (callback, delay) => {
			calls.push(`schedule:${delay}`);
			scheduled.push({ callback, delay });
		},
		resolveStartupState: (config) => {
			calls.push("resolve");
			assert.equal(config.storedBaseLayer, storage.getItem("baselayer"));
			assert.equal(config.storedOverlay, storage.getItem("overlay"));
			assert.equal(config.storedAutoCharts, storage.getItem("checkAutoCharts"));
			assert.equal(config.baseMaps, baseMaps);
			assert.equal(config.overlayMaps, overlayMaps);
			return startupState;
		},
		diagnostics,
	});
	return { calls, result, scheduled, storage, diagnosticEntries };
}

test("scheduleAutoChartUpdates schedules the established refresh delays", () => {
	const calls = [];
	const scheduled = [];
	const autoCharts = {
		update() {
			calls.push("autoCharts:update");
		},
	};
	scheduleAutoChartUpdates(autoCharts, (callback, delay) => {
		calls.push(`schedule:${delay}`);
		scheduled.push({ callback, delay });
	});

	assert.deepEqual(
		calls,
		AUTO_CHART_STARTUP_UPDATE_DELAYS_MS.map((delay) => `schedule:${delay}`),
	);
	assert.deepEqual(
		scheduled.map((item) => item.delay),
		AUTO_CHART_STARTUP_UPDATE_DELAYS_MS,
	);
	for (const item of scheduled) item.callback();
	assert.deepEqual(calls.slice(-3), [
		"autoCharts:update",
		"autoCharts:update",
		"autoCharts:update",
	]);
});

test("scheduleAutoChartResourceRefreshes retries delayed chart resources", async () => {
	const calls = [];
	const scheduled = [];
	const refreshResults = [false, true, false];
	const autoCharts = {
		async refreshCharts() {
			calls.push("autoCharts:refreshCharts");
			return refreshResults.shift() ?? false;
		},
		update() {
			calls.push("autoCharts:update");
		},
	};

	scheduleAutoChartResourceRefreshes(autoCharts, (callback, delay) => {
		calls.push(`schedule:${delay}`);
		scheduled.push({ callback, delay });
	});

	assert.deepEqual(
		scheduled.map((item) => item.delay),
		AUTO_CHART_RESOURCE_RETRY_DELAYS_MS,
	);
	await scheduled[0].callback();
	await scheduled[1].callback();
	await scheduled[2].callback();
	assert.deepEqual(calls.slice(AUTO_CHART_RESOURCE_RETRY_DELAYS_MS.length), [
		"autoCharts:refreshCharts",
		"autoCharts:refreshCharts",
		"autoCharts:update",
		"autoCharts:refreshCharts",
	]);
});

test("scheduleAutoChartResourceRefreshes is a no-op for older controllers", () => {
	const calls = [];
	scheduleAutoChartResourceRefreshes(
		{ update: () => calls.push("update") },
		() => calls.push("schedule"),
	);
	assert.deepEqual(calls, []);
});

test("applyAutoChartsStartup either disables or schedules Auto Charts", () => {
	const enabledCalls = [];
	const enabledCharts = {
		ensureVisible() {
			enabledCalls.push("ensureVisible");
		},
		update() {
			enabledCalls.push("update");
		},
	};
	const scheduled = [];
	applyAutoChartsStartup({
		autoCharts: enabledCharts,
		autoChartsEnabled: true,
		schedule: (callback, delay) => {
			enabledCalls.push(`schedule:${delay}`);
			scheduled.push(callback);
		},
	});
	assert.deepEqual(enabledCalls, [
		"ensureVisible",
		"schedule:100",
		"schedule:500",
		"schedule:1500",
	]);
	for (const callback of scheduled) callback();
	assert.deepEqual(enabledCalls.slice(-3), ["update", "update", "update"]);

	const disabledCalls = [];
	applyAutoChartsStartup({
		autoCharts: {
			toggle(enabled) {
				disabledCalls.push(`toggle:${enabled}`);
			},
		},
		autoChartsEnabled: false,
		schedule: () => disabledCalls.push("schedule"),
	});
	assert.deepEqual(disabledCalls, ["toggle:false"]);
});

test("applyAutoChartsStartup schedules resource refreshes when the controller supports them", () => {
	const calls = [];
	const autoCharts = {
		ensureVisible() {
			calls.push("ensureVisible");
		},
		refreshCharts() {
			calls.push("refreshCharts");
			return false;
		},
		update() {
			calls.push("update");
		},
	};

	applyAutoChartsStartup({
		autoCharts,
		autoChartsEnabled: true,
		schedule: (_callback, delay) => calls.push(`schedule:${delay}`),
	});

	assert.deepEqual(calls, [
		"ensureVisible",
		...AUTO_CHART_STARTUP_UPDATE_DELAYS_MS.map((delay) => `schedule:${delay}`),
		...AUTO_CHART_RESOURCE_RETRY_DELAYS_MS.map((delay) => `schedule:${delay}`),
	]);
});

test("persistAndAddBaseLayer stores the selected basemap before adding it", () => {
	const calls = [];
	const storage = {
		setItem(key, value) {
			calls.push(`set:${key}:${value}`);
		},
	};
	const map = { name: "map" };
	const baseMaps = {
		"NaturalEarth (offline)": fakeLayer("NaturalEarth (offline)", calls),
	};

	persistAndAddBaseLayer({
		storage,
		baseMaps,
		baseLayerName: "NaturalEarth (offline)",
		map,
	});

	assert.deepEqual(calls, [
		"set:baselayer:NaturalEarth (offline)",
		"add:NaturalEarth (offline):map",
	]);
});

test("startupBaseLayer returns the named basemap layer", () => {
	const layer = fakeLayer("NaturalEarth (offline)", []);
	assert.equal(
		startupBaseLayer({
			baseMaps: { "NaturalEarth (offline)": layer },
			baseLayerName: "NaturalEarth (offline)",
		}),
		layer,
	);
});

test("addStartupOverlay adds only named startup overlays", () => {
	const calls = [];
	const map = { name: "map" };
	const overlayMaps = {
		OpenSeaMap: fakeLayer("OpenSeaMap", calls),
	};

	addStartupOverlay({ overlayMaps, overlayName: "", map });
	assert.deepEqual(calls, []);

	addStartupOverlay({ overlayMaps, overlayName: "OpenSeaMap", map });
	assert.deepEqual(calls, ["add:OpenSeaMap:map"]);
});

test("startupOverlayLayer returns null for blank overlay names", () => {
	const openSeaMap = fakeLayer("OpenSeaMap", []);
	assert.equal(
		startupOverlayLayer({
			overlayMaps: { OpenSeaMap: openSeaMap },
			overlayName: "OpenSeaMap",
		}),
		openSeaMap,
	);
	assert.equal(
		startupOverlayLayer({
			overlayMaps: { OpenSeaMap: openSeaMap },
			overlayName: "",
		}),
		null,
	);
});

test("refreshStartupUi updates the selector before display settings init", () => {
	const calls = [];
	refreshStartupUi({
		chartLayerController: {
			updateChartSelectorControl() {
				calls.push("chartSelector:update");
			},
		},
		displaySettings: {
			init() {
				calls.push("display:init");
			},
		},
	});
	assert.deepEqual(calls, ["chartSelector:update", "display:init"]);
});

test("storedChartStartupSettings reads the three persisted chart keys", () => {
	assert.deepEqual(
		storedChartStartupSettings(
			fakeStorage({
				baselayer: "NaturalEarth (offline)",
				overlay: "OpenSeaMap",
				checkAutoCharts: "false",
			}),
		),
		{
			storedBaseLayer: "NaturalEarth (offline)",
			storedOverlay: "OpenSeaMap",
			storedAutoCharts: "false",
		},
	);
});

test("resolveChartStartupFromStorage combines stored values with layer maps", () => {
	const storage = fakeStorage({
		baselayer: "Empty",
		overlay: "OpenSeaMap",
		checkAutoCharts: "true",
	});
	const baseMaps = { Empty: {} };
	const overlayMaps = { OpenSeaMap: {} };
	const resolved = { baseLayerName: "Empty", overlayName: "OpenSeaMap", autoChartsEnabled: true };

	assert.equal(
		resolveChartStartupFromStorage({
			storage,
			baseMaps,
			overlayMaps,
			resolveStartupState(config) {
				assert.deepEqual(config, {
					storedBaseLayer: "Empty",
					storedOverlay: "OpenSeaMap",
					storedAutoCharts: "true",
					baseMaps,
					overlayMaps,
				});
				return resolved;
			},
		}),
		resolved,
	);
});

test("applyChartStartup preserves enabled Auto Charts startup order", () => {
	const { calls, result, scheduled, storage, diagnosticEntries } = setup({
		startupState: {
			baseLayerName: "NaturalEarth (offline)",
			overlayName: "OpenSeaMap",
			autoChartsEnabled: true,
		},
		storageValues: {
			baselayer: "OpenStreetMap",
			overlay: "OpenSeaMap",
			checkAutoCharts: "true",
		},
	});

	assert.deepEqual(result, {
		baseLayerName: "NaturalEarth (offline)",
		overlayName: "OpenSeaMap",
		autoChartsEnabled: true,
	});
	assert.equal(storage.value("baselayer"), "NaturalEarth (offline)");
	assert.deepEqual(calls, [
		"resolve",
		"add:NaturalEarth (offline):map",
		"autoCharts:ensureVisible",
		"schedule:100",
		"schedule:500",
		"schedule:1500",
		"add:OpenSeaMap:map",
		"chartSelector:update",
		"display:init",
	]);
	assert.deepEqual(
		scheduled.map((item) => item.delay),
		[100, 500, 1500],
	);
	assert.deepEqual(
		diagnosticEntries.map((entry) => entry.step),
		[
			"chart-startup:start",
			"chart-startup:resolved",
			"chart-startup:base-layer-added",
			"chart-startup:auto-charts-applied",
			"chart-startup:overlay-added",
			"chart-startup:ui-refreshed",
		],
	);
	for (const item of scheduled) item.callback();
	assert.deepEqual(calls.slice(-3), [
		"autoCharts:update",
		"autoCharts:update",
		"autoCharts:update",
	]);
});

test("applyChartStartup toggles Auto Charts off without delayed updates", () => {
	const { calls, scheduled } = setup({
		startupState: {
			baseLayerName: "Empty",
			overlayName: "",
			autoChartsEnabled: false,
		},
	});

	assert.deepEqual(calls, [
		"resolve",
		"add:Empty:map",
		"autoCharts:toggle:false",
		"chartSelector:update",
		"display:init",
	]);
	assert.deepEqual(scheduled, []);
});

test("applyChartStartup records and rethrows startup errors", () => {
	const diagnostics = {
		entries: [],
		record(step, details) {
			this.entries.push({ step, details });
		},
		error(step, error) {
			this.entries.push({ step, error });
		},
	};
	assert.throws(
		() =>
			applyChartStartup({
				map: { name: "map" },
				baseMaps: {},
				overlayMaps: {},
				autoCharts: {},
				chartLayerController: {},
				displaySettings: {},
				storage: fakeStorage(),
				resolveStartupState() {
					throw new Error("cannot resolve startup");
				},
				diagnostics,
			}),
		/cannot resolve startup/,
	);
	assert.deepEqual(
		diagnostics.entries.map((entry) => entry.step),
		["chart-startup:start", "chart-startup:error"],
	);
	assert.equal(diagnostics.entries[1].error.message, "cannot resolve startup");
});
