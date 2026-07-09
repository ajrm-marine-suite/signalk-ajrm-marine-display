import assert from "node:assert/strict";
import test from "node:test";

import {
	displayDebugControls,
	normalizeDisplayDebugControls,
	setDisplayDebugControls,
	startDisplayDebugControlPolling,
} from "../src/web/assets/scripts/display-debug-controls.mjs";

test("Display debug controls default every render feature on", () => {
	assert.deepEqual(normalizeDisplayDebugControls({}), {
		markerUpdates: true,
		courseLines: true,
		footprints: true,
		labels: true,
		targetTable: true,
		autoCharts: true,
		harbourLayer: true,
	});
});

test("Display debug controls preserve explicit false values", () => {
	const controls = setDisplayDebugControls({
		courseLines: false,
		footprints: false,
	});

	assert.equal(displayDebugControls().courseLines, false);
	assert.equal(displayDebugControls().footprints, false);
	assert.equal(controls.markerUpdates, true);
});

test("Display debug control polling applies server controls", async () => {
	const callbacks = [];
	const windowRef = {
		AJRM_MARINE_DISPLAY_DEBUG_CONTROLS: null,
		setTimeout(callback) {
			callbacks.push(callback);
			return callbacks.length;
		},
		clearTimeout() {},
	};
	const monitor = startDisplayDebugControlPolling({
		windowRef,
		fetchFn: async () => ({
			ok: true,
			json: async () => ({ controls: { labels: false, targetTable: false } }),
		}),
	});

	await Promise.resolve();
	await Promise.resolve();

	assert.equal(displayDebugControls().labels, false);
	assert.equal(displayDebugControls().targetTable, false);
	assert.equal(windowRef.AJRM_MARINE_DISPLAY_DEBUG_CONTROLS.labels, false);
	monitor.stop();
});
