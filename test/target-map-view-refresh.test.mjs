import assert from "node:assert/strict";
import test from "node:test";

import { refreshMapViewForSelfTarget } from "../src/web/assets/scripts/target-map-view-refresh.mjs";

function setup() {
	const calls = [];
	return {
		calls,
		args: {
			selfTarget: { isValid: true, latitude: 55.5, longitude: -5.5 },
			map: { panTo: (...args) => calls.push(["panTo", args]) },
			shouldFollow: false,
			disableMapPanTo: false,
			setDisableMoveend: (value) => calls.push(["setDisableMoveend", value]),
			drawRangeRings: (options) => calls.push(["drawRangeRings", options]),
			autoCharts: { update: () => calls.push(["autoCharts.update"]) },
			updateHarbourDisplay: () => calls.push(["updateHarbourDisplay"]),
		},
	};
}

test("refreshMapViewForSelfTarget draws range rings by default", () => {
	const { args, calls } = setup();

	refreshMapViewForSelfTarget(args);

	assert.deepEqual(calls, [
		["drawRangeRings", { enabled: true }],
		["autoCharts.update"],
		["updateHarbourDisplay"],
	]);
});

test("refreshMapViewForSelfTarget clears range rings when debug control disables them", () => {
	const { args, calls } = setup();

	refreshMapViewForSelfTarget({
		...args,
		debugControls: { rangeRings: false },
	});

	assert.deepEqual(calls, [
		["drawRangeRings", { enabled: false }],
		["autoCharts.update"],
		["updateHarbourDisplay"],
	]);
});
