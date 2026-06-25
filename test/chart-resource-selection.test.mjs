import assert from "node:assert/strict";
import test from "node:test";
import {
	CHART_ZOOM_TOLERANCE,
	chartZoomMatches,
	pointInChartBounds,
} from "../src/web/assets/scripts/chart-resource-selection.mjs";

test("pointInChartBounds treats chart bounds as inclusive edges", () => {
	const bounds = [-5, 53, -3, 55];

	assert.equal(pointInChartBounds(bounds, 53, -5), true);
	assert.equal(pointInChartBounds(bounds, 55, -3), true);
	assert.equal(pointInChartBounds(bounds, 52.99, -4), false);
	assert.equal(pointInChartBounds(null, 54, -4), false);
});

test("chartZoomMatches exposes the established zoom tolerance", () => {
	assert.equal(CHART_ZOOM_TOLERANCE, 0.1);
	assert.equal(
		chartZoomMatches(
			{ minzoom: 10 },
			{ zoom: 10 - CHART_ZOOM_TOLERANCE / 2, maxZoom: 22 },
		),
		true,
	);
	assert.equal(
		chartZoomMatches(
			{ minzoom: 10 },
			{ zoom: 10 - CHART_ZOOM_TOLERANCE * 2, maxZoom: 22 },
		),
		false,
	);
});
