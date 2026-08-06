import assert from "node:assert/strict";
import test from "node:test";
import {
	CHART_ZOOM_TOLERANCE,
	chartZoomMatches,
	chooseBestChart,
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

test("Auto Charts selects Cuan charts at native detail and retains Antares through overzoom", () => {
	const detailedAntaresChart = {
		name: "AC 5615A Cuan Sound, The Narrows and Anchorage, edition 7",
		bounds: [-5.6343634, 56.25099545, -5.61286818, 56.26605459],
		minzoom: 13,
		maxzoom: 18,
	};
	const broaderAdmiraltyChart = {
		name: "W-2326-0",
		bounds: [-5.7627567, 56.0590169, -5.5004255, 56.2791597],
		minzoom: 14,
		maxzoom: 15,
	};
	const overviewAdmiraltyChart = {
		name: "W-2169-0",
		bounds: [-6.6512403, 55.9248317, -5.4259987, 56.356403],
		minzoom: 12,
		maxzoom: 13,
	};
	const chartList = [
		broaderAdmiraltyChart,
		detailedAntaresChart,
		overviewAdmiraltyChart,
	];
	const position = { lat: 56.2585, lng: -5.6236, maxZoom: 22 };

	assert.equal(
		chooseBestChart(chartList, { ...position, zoom: 13 }),
		overviewAdmiraltyChart,
	);
	assert.equal(
		chooseBestChart(chartList, { ...position, zoom: 14 }),
		broaderAdmiraltyChart,
	);
	assert.equal(
		chooseBestChart(chartList, { ...position, zoom: 15 }),
		broaderAdmiraltyChart,
	);
	assert.equal(
		chooseBestChart(chartList, { ...position, zoom: 16 }),
		detailedAntaresChart,
	);
	assert.equal(
		chooseBestChart(chartList, { ...position, zoom: 22 }),
		detailedAntaresChart,
	);
});
