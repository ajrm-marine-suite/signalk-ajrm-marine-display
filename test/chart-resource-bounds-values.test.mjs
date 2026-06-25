import assert from "node:assert/strict";
import test from "node:test";
import {
	CHART_BOUNDS_SOURCE_GETTERS,
	chartBoundsSource,
	objectBoundsValues,
	rawBoundsValues,
} from "../src/web/assets/scripts/chart-resource-bounds-values.mjs";

test("chartBoundsSource preserves established bounds field priority", () => {
	const chart = {
		bounds: "primary",
		boundingBox: "secondary",
		properties: { bounds: "properties" },
		metadata: { bounds: "metadata" },
	};

	assert.equal(chartBoundsSource(chart), "primary");
	assert.equal(CHART_BOUNDS_SOURCE_GETTERS.length, 7);
});

test("chartBoundsSource falls through Signal K chart metadata shapes", () => {
	assert.deepEqual(
		chartBoundsSource({ properties: { bbox: [-5, 53, -3, 55] } }),
		[-5, 53, -3, 55],
	);
	assert.deepEqual(
		chartBoundsSource({ metadata: { bounds: [-6, 52, -2, 56] } }),
		[-6, 52, -2, 56],
	);
});

test("objectBoundsValues keeps supported coordinate key variants", () => {
	assert.deepEqual(
		objectBoundsValues({
			west: -5,
			south: 53,
			east: -3,
			north: 55,
		}),
		[-5, 53, -3, 55],
	);
	assert.deepEqual(
		objectBoundsValues({
			minLongitude: -5,
			minLatitude: 53,
			maxLongitude: -3,
			maxLatitude: 55,
		}),
		[-5, 53, -3, 55],
	);
});

test("rawBoundsValues parses comma and whitespace bounds strings", () => {
	assert.deepEqual(rawBoundsValues("-5, 53 -3,55"), [-5, 53, -3, 55]);
});
