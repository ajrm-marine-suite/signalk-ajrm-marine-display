import assert from "node:assert/strict";
import test from "node:test";
import {
	clearAutoChartLayer,
	createAutoChartLayerState,
	hasActiveAutoChartLayer,
	resetAutoChartFallback,
	setAutoChartLayer,
} from "../src/web/assets/scripts/auto-chart-layer-state.mjs";

function fakeLayer() {
	return {
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
			calls.push("add");
			layers.add(layer);
		},
		clearLayers() {
			calls.push("clear");
			layers.clear();
		},
		hasLayer(layer) {
			return layers.has(layer);
		},
	};
}

test("setAutoChartLayer clears old layers and tracks a valid chart layer", () => {
	const group = fakeGroup();
	const state = createAutoChartLayerState();
	const layer = fakeLayer();
	const selected = { __autoChartId: "chart-1" };

	assert.equal(setAutoChartLayer({ group, layer, selected, state }), true);

	assert.deepEqual(group.calls, ["clear", "add"]);
	assert.equal(state.chartId, "chart-1");
	assert.equal(state.chartLayer, layer);
	assert.equal(hasActiveAutoChartLayer({ group, selected, state }), true);
});

test("setAutoChartLayer resets state when layer creation fails", () => {
	const group = fakeGroup();
	const state = createAutoChartLayerState();

	assert.equal(
		setAutoChartLayer({
			group,
			layer: {},
			selected: { __autoChartId: "bad-chart" },
			state,
		}),
		false,
	);

	assert.deepEqual(group.calls, ["clear"]);
	assert.deepEqual(state, { chartId: null, chartLayer: null });
});

test("clearAutoChartLayer and resetAutoChartFallback preserve fallback behaviour", () => {
	const group = fakeGroup();
	const state = { chartId: "chart-1", chartLayer: null };

	resetAutoChartFallback(state);
	assert.equal(state.chartId, null);

	state.chartId = "chart-2";
	state.chartLayer = fakeLayer();
	clearAutoChartLayer({ group, state });

	assert.deepEqual(group.calls, ["clear"]);
	assert.deepEqual(state, { chartId: null, chartLayer: null });
});
