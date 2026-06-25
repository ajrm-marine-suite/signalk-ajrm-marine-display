import assert from "node:assert/strict";
import test from "node:test";
import {
	applyResolvedChartStartup,
	applyStartupAutoChartsStep,
	applyStartupBaseLayerStep,
	applyStartupOverlayStep,
	applyStartupUiStep,
} from "../src/web/assets/scripts/chart-startup-sequence.mjs";

function fakeLayer(name, calls) {
	return {
		name,
		addTo(map) {
			calls.push(`add:${name}:${map.name}`);
		},
	};
}

test("applyResolvedChartStartup keeps the established layer startup order", () => {
	const calls = [];
	const diagnosticEntries = [];
	const scheduled = [];
	const map = { name: "map" };
	const storage = {
		setItem(key, value) {
			calls.push(`set:${key}:${value}`);
		},
	};

	applyResolvedChartStartup({
		map,
		storage,
		baseMaps: {
			"NaturalEarth (offline)": fakeLayer("NaturalEarth (offline)", calls),
		},
		overlayMaps: {
			OpenSeaMap: fakeLayer("OpenSeaMap", calls),
		},
		autoCharts: {
			ensureVisible() {
				calls.push("autoCharts:ensureVisible");
			},
			update() {
				calls.push("autoCharts:update");
			},
		},
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
		schedule(callback, delay) {
			calls.push(`schedule:${delay}`);
			scheduled.push({ callback, delay });
		},
		chartStartupState: {
			baseLayerName: "NaturalEarth (offline)",
			overlayName: "OpenSeaMap",
			autoChartsEnabled: true,
		},
		diagnostics: {
			record(step, details) {
				diagnosticEntries.push({ step, details });
			},
		},
	});

	assert.deepEqual(calls, [
		"set:baselayer:NaturalEarth (offline)",
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
			"chart-startup:base-layer-added",
			"chart-startup:auto-charts-applied",
			"chart-startup:overlay-added",
			"chart-startup:ui-refreshed",
		],
	);
});

test("applyResolvedChartStartup disables Auto Charts without adding a normal overlay", () => {
	const calls = [];
	const map = { name: "map" };

	applyResolvedChartStartup({
		map,
		storage: {
			setItem(key, value) {
				calls.push(`set:${key}:${value}`);
			},
		},
		baseMaps: {
			Empty: fakeLayer("Empty", calls),
		},
		overlayMaps: {},
		autoCharts: {
			toggle(enabled) {
				calls.push(`autoCharts:toggle:${enabled}`);
			},
		},
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
		schedule() {
			calls.push("schedule");
		},
		chartStartupState: {
			baseLayerName: "Empty",
			overlayName: "",
			autoChartsEnabled: false,
		},
	});

	assert.deepEqual(calls, [
		"set:baselayer:Empty",
		"add:Empty:map",
		"autoCharts:toggle:false",
		"chartSelector:update",
		"display:init",
	]);
});

test("startup sequence step helpers expose the established action order", () => {
	const calls = [];
	const diagnosticEntries = [];
	const diagnostics = {
		record(step, details) {
			diagnosticEntries.push({ step, details });
		},
	};
	const map = { name: "map" };
	const storage = {
		setItem(key, value) {
			calls.push(`set:${key}:${value}`);
		},
	};
	const scheduled = [];

	applyStartupBaseLayerStep({
		map,
		storage,
		baseMaps: { Base: fakeLayer("Base", calls) },
		baseLayerName: "Base",
		diagnostics,
	});
	applyStartupAutoChartsStep({
		autoCharts: {
			ensureVisible() {
				calls.push("autoCharts:ensureVisible");
			},
			update() {
				calls.push("autoCharts:update");
			},
		},
		autoChartsEnabled: true,
		schedule(callback, delay) {
			calls.push(`schedule:${delay}`);
			scheduled.push(callback);
		},
		diagnostics,
	});
	applyStartupOverlayStep({
		map,
		overlayMaps: { OpenSeaMap: fakeLayer("OpenSeaMap", calls) },
		overlayName: "OpenSeaMap",
		diagnostics,
	});
	applyStartupUiStep({
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
		diagnostics,
	});

	assert.deepEqual(calls, [
		"set:baselayer:Base",
		"add:Base:map",
		"autoCharts:ensureVisible",
		"schedule:100",
		"schedule:500",
		"schedule:1500",
		"add:OpenSeaMap:map",
		"chartSelector:update",
		"display:init",
	]);
	assert.equal(scheduled.length, 3);
	assert.deepEqual(
		diagnosticEntries.map((entry) => entry.step),
		[
			"chart-startup:base-layer-added",
			"chart-startup:auto-charts-applied",
			"chart-startup:overlay-added",
			"chart-startup:ui-refreshed",
		],
	);
});
