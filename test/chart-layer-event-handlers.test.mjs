import assert from "node:assert/strict";
import test from "node:test";
import {
	applyBaseLayerChange,
	applyChartLayerDisplayMode,
	applyOverlayAdded,
	applyOverlayRemoved,
	createChartLayerEventHandlers,
} from "../src/web/assets/scripts/chart-layer-event-handlers.mjs";
import { SETTINGS_STORAGE_KEYS } from "../src/web/assets/scripts/settings-storage-keys.mjs";

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

function setup() {
	const autoCharts = {
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
	const storage = fakeStorage();
	const handlers = createChartLayerEventHandlers({
		autoCharts,
		displaySettings,
		harbourDisplay,
		storage,
	});
	return { autoCharts, displaySettings, harbourDisplay, handlers, storage };
}

test("chart layer base handler persists basemap and refreshes Auto Charts", () => {
	const { autoCharts, displaySettings, handlers, storage } = setup();

	handlers.handleBaseLayerChange({ name: "NaturalEarth (offline)" });

	assert.equal(
		storage.getItem(SETTINGS_STORAGE_KEYS.baseLayer),
		"NaturalEarth (offline)",
	);
	assert.deepEqual(autoCharts.calls, ["resetFallback", "update", "keepOnTop"]);
	assert.deepEqual(displaySettings.calls, ["applyColorMode"]);
});

test("applyBaseLayerChange persists basemap and refreshes chart presentation", () => {
	const { autoCharts, displaySettings, storage } = setup();

	applyBaseLayerChange({
		autoCharts,
		displaySettings,
		storage,
		name: "NaturalEarth (offline)",
	});

	assert.equal(
		storage.getItem(SETTINGS_STORAGE_KEYS.baseLayer),
		"NaturalEarth (offline)",
	);
	assert.deepEqual(autoCharts.calls, ["resetFallback", "update", "keepOnTop"]);
	assert.deepEqual(displaySettings.calls, ["applyColorMode"]);
});

test("chart layer overlay add handler keeps OpenSeaMap above chart tiles", () => {
	const { autoCharts, displaySettings, handlers, storage } = setup();

	handlers.handleOverlayAdd({ name: "OpenSeaMap" });

	assert.equal(storage.getItem(SETTINGS_STORAGE_KEYS.overlayLayer), "OpenSeaMap");
	assert.deepEqual(autoCharts.calls, ["keepOnTop"]);
	assert.deepEqual(displaySettings.calls, ["applyColorMode"]);
});

test("applyOverlayAdded stores normal overlays and keeps OpenSeaMap above charts", () => {
	const { autoCharts, displaySettings, storage } = setup();

	applyOverlayAdded({
		autoCharts,
		displaySettings,
		storage,
		name: "OpenSeaMap",
	});

	assert.equal(storage.getItem(SETTINGS_STORAGE_KEYS.overlayLayer), "OpenSeaMap");
	assert.deepEqual(autoCharts.calls, ["keepOnTop"]);
	assert.deepEqual(displaySettings.calls, ["applyColorMode"]);
});

test("chart layer overlay handlers toggle Auto Charts without storing it", () => {
	const { autoCharts, displaySettings, handlers, storage } = setup();

	handlers.handleOverlayAdd({ name: "Auto Charts" });
	handlers.handleOverlayRemove({ name: "Auto Charts" });

	assert.equal(storage.getItem(SETTINGS_STORAGE_KEYS.overlayLayer), null);
	assert.deepEqual(autoCharts.calls, ["toggle:true", "toggle:false"]);
	assert.deepEqual(displaySettings.calls, ["applyColorMode"]);
});

test("applyOverlayAdded and applyOverlayRemoved toggle Auto Charts specially", () => {
	const { autoCharts, displaySettings, storage } = setup();

	applyOverlayAdded({
		autoCharts,
		displaySettings,
		storage,
		name: "Auto Charts",
	});
	applyOverlayRemoved({ autoCharts, storage, name: "Auto Charts" });

	assert.equal(storage.getItem(SETTINGS_STORAGE_KEYS.overlayLayer), null);
	assert.deepEqual(autoCharts.calls, ["toggle:true", "toggle:false"]);
	assert.deepEqual(displaySettings.calls, ["applyColorMode"]);
});

test("chart layer overlay handlers persist harbour limits separately", () => {
	const { autoCharts, displaySettings, harbourDisplay, handlers, storage } =
		setup();

	handlers.handleOverlayAdd({ name: "Harbour Limits" });
	handlers.handleOverlayRemove({ name: "Harbour Limits" });

	assert.equal(storage.getItem(SETTINGS_STORAGE_KEYS.displayHarbours), "false");
	assert.equal(storage.getItem(SETTINGS_STORAGE_KEYS.overlayLayer), null);
	assert.deepEqual(harbourDisplay.calls, ["update:true", "update:false"]);
	assert.deepEqual(autoCharts.calls, []);
	assert.deepEqual(displaySettings.calls, ["applyColorMode"]);
});

test("applyOverlayAdded and applyOverlayRemoved handle harbour limits specially", () => {
	const { autoCharts, displaySettings, harbourDisplay, storage } = setup();

	applyOverlayAdded({
		autoCharts,
		displaySettings,
		harbourDisplay,
		storage,
		name: "Harbour Limits",
	});
	applyOverlayRemoved({
		autoCharts,
		harbourDisplay,
		storage,
		name: "Harbour Limits",
	});

	assert.equal(storage.getItem(SETTINGS_STORAGE_KEYS.displayHarbours), "false");
	assert.equal(storage.getItem(SETTINGS_STORAGE_KEYS.overlayLayer), null);
	assert.deepEqual(harbourDisplay.calls, ["update:true", "update:false"]);
	assert.deepEqual(autoCharts.calls, []);
	assert.deepEqual(displaySettings.calls, ["applyColorMode"]);
});

test("chart layer overlay remove handler clears normal overlay storage", () => {
	const { autoCharts, handlers, storage } = setup();
	storage.setItem(SETTINGS_STORAGE_KEYS.overlayLayer, "OpenSeaMap");

	handlers.handleOverlayRemove({ name: "OpenSeaMap" });

	assert.equal(storage.getItem(SETTINGS_STORAGE_KEYS.overlayLayer), null);
	assert.deepEqual(autoCharts.calls, []);
});

test("applyChartLayerDisplayMode delegates to display settings colour mode", () => {
	const displaySettings = {
		calls: [],
		applyColorMode() {
			this.calls.push("applyColorMode");
		},
	};

	applyChartLayerDisplayMode(displaySettings);

	assert.deepEqual(displaySettings.calls, ["applyColorMode"]);
});
