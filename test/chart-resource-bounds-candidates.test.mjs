import assert from "node:assert/strict";
import test from "node:test";
import {
	chartBoundsKey,
	pointBoundsCandidates,
	rawBoundsCandidates,
	uniqueChartBounds,
} from "../src/web/assets/scripts/chart-resource-bounds-candidates.mjs";

test("chartBoundsKey gives duplicate bounds a stable comparison key", () => {
	assert.equal(chartBoundsKey([-5, 53, -3, 55]), "-5,53,-3,55");
});

test("uniqueChartBounds removes duplicate candidate bounds", () => {
	assert.deepEqual(
		uniqueChartBounds([
			[-5, 53, -3, 55],
			[-5, 53, -3, 55],
			[-4, 54, -3, 55],
		]),
		[
			[-5, 53, -3, 55],
			[-4, 54, -3, 55],
		],
	);
});

test("pointBoundsCandidates creates lon-lat and lat-lon candidates", () => {
	assert.deepEqual(
		pointBoundsCandidates([
			[-5, 53],
			[-3, 55],
		]),
		[
			[-5, 53, -3, 55],
			[53, -5, 55, -3],
		],
	);
});

test("rawBoundsCandidates normalises both possible axis orders", () => {
	assert.deepEqual(rawBoundsCandidates([53, -5, 55, -3]), [
		[53, -5, 55, -3],
		[-5, 53, -3, 55],
	]);
});
