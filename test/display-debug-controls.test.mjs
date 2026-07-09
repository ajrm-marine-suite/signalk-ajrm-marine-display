import assert from "node:assert/strict";
import test from "node:test";

import {
	applyDisplayDebugMapControls,
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
		rangeRings: true,
		autoCharts: true,
		harbourLayer: true,
		mapContainer: true,
		tilePane: true,
		overlayPane: true,
		shadowPane: true,
		markerPane: true,
		tooltipPane: true,
		popupPane: true,
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

test("Display debug control polling notifies a control applier", async () => {
	let appliedControls;
	const windowRef = {
		setTimeout() {
			return 1;
		},
		clearTimeout() {},
	};
	const monitor = startDisplayDebugControlPolling({
		windowRef,
		fetchFn: async () => ({
			ok: true,
			json: async () => ({ controls: { tilePane: false } }),
		}),
		onControls: (controls) => {
			appliedControls = controls;
		},
	});

	await Promise.resolve();
	await Promise.resolve();

	assert.equal(appliedControls.tilePane, false);
	monitor.stop();
});

test("Display debug map controls hide selected Leaflet panes", () => {
	const elements = Object.fromEntries(
		[
			"container",
			"tilePane",
			"overlayPane",
			"shadowPane",
			"markerPane",
			"tooltipPane",
			"popupPane",
		].map((name) => [name, { name, style: {} }]),
	);
	const map = {
		getContainer: () => elements.container,
		getPane: (name) => elements[name],
	};

	applyDisplayDebugMapControls({
		map,
		controls: normalizeDisplayDebugControls({
			mapContainer: false,
			tilePane: false,
			markerPane: false,
		}),
	});

	assert.equal(elements.container.style.visibility, "hidden");
	assert.equal(elements.tilePane.style.visibility, "hidden");
	assert.equal(elements.markerPane.style.visibility, "hidden");
	assert.equal(elements.overlayPane.style.visibility, "");

	applyDisplayDebugMapControls({
		map,
		controls: normalizeDisplayDebugControls({}),
	});

	assert.equal(elements.container.style.visibility, "");
	assert.equal(elements.tilePane.style.visibility, "");
	assert.equal(elements.markerPane.style.visibility, "");
});
