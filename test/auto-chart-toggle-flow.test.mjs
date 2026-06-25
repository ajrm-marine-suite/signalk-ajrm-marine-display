import assert from "node:assert/strict";
import test from "node:test";
import { applyAutoChartToggle } from "../src/web/assets/scripts/auto-chart-toggle-flow.mjs";

function fakeStorage() {
	const values = new Map();
	return {
		getItem(key) {
			return values.get(key) ?? null;
		},
		setItem(key, value) {
			values.set(key, value);
		},
	};
}

function fakeGroup(calls) {
	return {
		clearLayers() {
			calls.push("clear");
		},
		removeFrom(map) {
			calls.push("remove");
			map.present = false;
		},
	};
}

function setup({ present = true } = {}) {
	const calls = [];
	const group = fakeGroup(calls);
	const map = {
		present,
		hasLayer(layer) {
			return layer === group && this.present;
		},
	};
	return {
		calls,
		group,
		map,
		state: { chartId: "chart", chartLayer: {} },
		storage: fakeStorage(),
	};
}

test("applyAutoChartToggle enables Auto Charts by storing the flag and updating", () => {
	const { calls, group, map, state, storage } = setup();

	const enabled = applyAutoChartToggle({
		ensureVisible: () => calls.push("ensure"),
		group,
		map,
		nextEnabled: true,
		state,
		storage,
		storageKey: "auto",
		update: () => calls.push("update"),
	});

	assert.equal(enabled, true);
	assert.equal(storage.getItem("auto"), "true");
	assert.deepEqual(calls, ["ensure", "update"]);
	assert.deepEqual(state, { chartId: "chart", chartLayer: {} });
});

test("applyAutoChartToggle disables Auto Charts by clearing and removing visible group", () => {
	const { calls, group, map, state, storage } = setup();

	const enabled = applyAutoChartToggle({
		ensureVisible: () => calls.push("ensure"),
		group,
		map,
		nextEnabled: false,
		state,
		storage,
		storageKey: "auto",
		update: () => calls.push("update"),
	});

	assert.equal(enabled, false);
	assert.equal(storage.getItem("auto"), "false");
	assert.deepEqual(calls, ["clear", "remove"]);
	assert.deepEqual(state, { chartId: null, chartLayer: null });
	assert.equal(map.hasLayer(group), false);
});

test("applyAutoChartToggle clears without removing when group is already absent", () => {
	const { calls, group, map, state, storage } = setup({ present: false });

	applyAutoChartToggle({
		ensureVisible: () => calls.push("ensure"),
		group,
		map,
		nextEnabled: false,
		state,
		storage,
		storageKey: "auto",
		update: () => calls.push("update"),
	});

	assert.deepEqual(calls, ["clear"]);
	assert.deepEqual(state, { chartId: null, chartLayer: null });
});
