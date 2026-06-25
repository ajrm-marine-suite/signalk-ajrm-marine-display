import assert from "node:assert/strict";
import test from "node:test";
import { updateAutoChartLayer } from "../src/web/assets/scripts/auto-chart-update-flow.mjs";

function fakeLayer(name) {
	return {
		name,
		addTo() {},
		remove() {},
	};
}

function fakeGroup() {
	const layers = new Set();
	const calls = [];
	return {
		calls,
		addLayer(layer) {
			calls.push(`add:${layer.name}`);
			layers.add(layer);
		},
		clearLayers() {
			calls.push("clear");
			layers.clear();
		},
		hasLayer(layer) {
			return layers.has(layer);
		},
		prime(layer) {
			layers.add(layer);
		},
	};
}

test("updateAutoChartLayer clears and reorders when no chart is selected", () => {
	const calls = [];
	const group = fakeGroup();
	const state = { chartId: "old", chartLayer: fakeLayer("old") };

	const changed = updateAutoChartLayer({
		group,
		keepOnTop: () => calls.push("top"),
		makeChartLayer: () => {
			throw new Error("should not create a layer");
		},
		selected: null,
		state,
	});

	assert.equal(changed, true);
	assert.deepEqual(group.calls, ["clear"]);
	assert.deepEqual(calls, ["top"]);
	assert.deepEqual(state, { chartId: null, chartLayer: null });
});

test("updateAutoChartLayer skips an already active chart layer", () => {
	const calls = [];
	const group = fakeGroup();
	const layer = fakeLayer("chart");
	const selected = { __autoChartId: "chart" };
	const state = { chartId: "chart", chartLayer: layer };
	group.prime(layer);

	const changed = updateAutoChartLayer({
		group,
		keepOnTop: () => calls.push("top"),
		makeChartLayer: () => {
			throw new Error("should not create a layer");
		},
		selected,
		state,
	});

	assert.equal(changed, false);
	assert.deepEqual(group.calls, []);
	assert.deepEqual(calls, []);
	assert.equal(state.chartLayer, layer);
});

test("updateAutoChartLayer skips an already cleared empty selection", () => {
	const calls = [];
	const group = fakeGroup();
	const state = { chartId: null, chartLayer: null };

	const changed = updateAutoChartLayer({
		group,
		keepOnTop: () => calls.push("top"),
		makeChartLayer: () => {
			throw new Error("should not create a layer");
		},
		selected: null,
		state,
	});

	assert.equal(changed, false);
	assert.deepEqual(group.calls, []);
	assert.deepEqual(calls, []);
});

test("updateAutoChartLayer swaps to a newly selected valid chart layer", () => {
	const calls = [];
	const group = fakeGroup();
	const layer = fakeLayer("new");
	const selected = { __autoChartId: "new" };
	const state = { chartId: "old", chartLayer: fakeLayer("old") };

	const changed = updateAutoChartLayer({
		group,
		keepOnTop: () => calls.push("top"),
		makeChartLayer: (chart) => {
			assert.equal(chart, selected);
			return layer;
		},
		selected,
		state,
	});

	assert.equal(changed, true);
	assert.deepEqual(group.calls, ["clear", "add:new"]);
	assert.deepEqual(calls, ["top"]);
	assert.equal(state.chartId, "new");
	assert.equal(state.chartLayer, layer);
});

test("updateAutoChartLayer does not reorder when layer creation fails", () => {
	const calls = [];
	const group = fakeGroup();
	const state = { chartId: "old", chartLayer: fakeLayer("old") };

	const changed = updateAutoChartLayer({
		group,
		keepOnTop: () => calls.push("top"),
		makeChartLayer: () => ({}),
		selected: { __autoChartId: "bad" },
		state,
	});

	assert.equal(changed, false);
	assert.deepEqual(group.calls, ["clear"]);
	assert.deepEqual(calls, []);
	assert.deepEqual(state, { chartId: null, chartLayer: null });
});
