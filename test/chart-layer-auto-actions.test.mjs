import assert from "node:assert/strict";
import test from "node:test";
import {
	refreshAutoChartsAfterBaseLayerChange,
	updateEnabledAutoCharts,
} from "../src/web/assets/scripts/chart-layer-auto-actions.mjs";

function fakeAutoCharts(enabled = true) {
	return {
		enabled,
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
	};
}

test("updateEnabledAutoCharts preserves reset, update, reorder sequence", () => {
	const autoCharts = fakeAutoCharts();

	updateEnabledAutoCharts(autoCharts);

	assert.deepEqual(autoCharts.calls, ["resetFallback", "update", "keepOnTop"]);
});

test("refreshAutoChartsAfterBaseLayerChange skips disabled Auto Charts", () => {
	const autoCharts = fakeAutoCharts(false);

	refreshAutoChartsAfterBaseLayerChange(autoCharts);

	assert.deepEqual(autoCharts.calls, []);
});
