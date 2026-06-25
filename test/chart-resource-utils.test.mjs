import assert from "node:assert/strict";
import test from "node:test";
import {
	chartBounds,
	chartContains,
	chartUrl,
	chartZoom,
	chartZoomMatches,
	compareChartCandidates,
	chooseBestChart,
} from "../src/web/assets/scripts/chart-resource-utils.mjs";

test("chartUrl accepts Signal K chart resource URL variants", () => {
	assert.equal(chartUrl({ tilemapUrl: "/tilemap" }), "/tilemap");
	assert.equal(chartUrl({ url: "/url" }), "/url");
	assert.equal(chartUrl({ tileUrl: "/tile-url" }), "/tile-url");
	assert.equal(chartUrl({ href: "/href" }), "/href");
	assert.equal(chartUrl({}), "");
});

test("chartBounds handles west/south/east/north arrays", () => {
	const chart = { bounds: [-5, 53, -3, 55] };
	assert.deepEqual(chartBounds(chart, 54, -4), [-5, 53, -3, 55]);
	assert.equal(chartContains(chart, 54, -4), true);
	assert.equal(chartContains(chart, 52, -4), false);
});

test("chartBounds handles lat/lon array order when position disambiguates it", () => {
	const chart = { bounds: [53, -5, 55, -3] };
	assert.deepEqual(chartBounds(chart, 54, -4), [-5, 53, -3, 55]);
	assert.equal(chartContains(chart, 54, -4), true);
});

test("chartBounds handles sw/ne object bounds", () => {
	const chart = {
		bounds: {
			sw: { lat: 53, lng: -5 },
			ne: { lat: 55, lng: -3 },
		},
	};
	assert.deepEqual(chartBounds(chart, 54, -4), [-5, 53, -3, 55]);
});

test("chartZoom defaults invalid values conservatively", () => {
	assert.deepEqual(chartZoom({ minzoom: "11", maxzoom: "12" }), {
		min: 11,
		max: 12,
	});
	assert.deepEqual(chartZoom({ minzoom: "bad", maxZoom: "bad" }), {
		min: 0,
		max: 24,
	});
});

test("chooseBestChart prefers the highest minimum zoom, then smaller area", () => {
	const charts = [
		{
			__autoChartId: "coarse",
			bounds: [-6, 52, -2, 56],
			minzoom: 7,
			maxzoom: 9,
		},
		{
			__autoChartId: "tiny-lower-minzoom",
			bounds: [-4.8, 53.8, -4.2, 54.2],
			minzoom: 10,
			maxzoom: 14,
		},
		{
			__autoChartId: "detail",
			bounds: [-5, 53, -3, 55],
			minzoom: 11,
			maxzoom: 12,
		},
	];

	assert.equal(
		chooseBestChart(charts, {
			lat: 54,
			lng: -4.5,
			zoom: 10,
			maxZoom: 22,
		}).__autoChartId,
		"tiny-lower-minzoom",
	);
	assert.equal(
		chooseBestChart(charts, {
			lat: 54,
			lng: -4.5,
			zoom: 11,
			maxZoom: 22,
		}).__autoChartId,
		"detail",
	);
});

test("compareChartCandidates preserves Auto Charts ranking rules", () => {
	const charts = [
		{
			__autoChartId: "wide-detail",
			bounds: [-6, 52, -2, 56],
			minzoom: 11,
			maxzoom: 12,
		},
		{
			__autoChartId: "smaller-detail",
			bounds: [-5, 53, -3, 55],
			minzoom: 11,
			maxzoom: 14,
		},
		{
			__autoChartId: "higher-minzoom",
			bounds: [-5, 53, -3, 55],
			minzoom: 12,
			maxzoom: 12,
		},
	];

	assert.deepEqual(
		charts
			.toSorted(compareChartCandidates({ lat: 54, lng: -4 }))
			.map((chart) => chart.__autoChartId),
		["higher-minzoom", "smaller-detail", "wide-detail"],
	);
});

test("chartZoomMatches allows slight tolerance and overzooming", () => {
	const chart = { minzoom: 10, maxzoom: 12 };
	assert.equal(chartZoomMatches(chart, { zoom: 9.95, maxZoom: 22 }), true);
	assert.equal(chartZoomMatches(chart, { zoom: 9.8, maxZoom: 22 }), false);
	assert.equal(chartZoomMatches(chart, { zoom: 22.05, maxZoom: 22 }), true);
	assert.equal(chartZoomMatches(chart, { zoom: 22.2, maxZoom: 22 }), false);
});

test("chooseBestChart allows overzooming above a chart native max zoom", () => {
	const charts = [
		{
			__autoChartId: "detail",
			bounds: [-5, 53, -3, 55],
			minzoom: 11,
			maxzoom: 12,
		},
	];

	assert.equal(
		chooseBestChart(charts, {
			lat: 54,
			lng: -4,
			zoom: 18,
			maxZoom: 22,
		}).__autoChartId,
		"detail",
	);
});

test("chooseBestChart returns null when no chart contains the position", () => {
	const chart = {
		__autoChartId: "elsewhere",
		bounds: [-5, 53, -3, 55],
		minzoom: 11,
		maxzoom: 12,
	};
	assert.equal(
		chooseBestChart([chart], {
			lat: 60,
			lng: -4,
			zoom: 11,
			maxZoom: 22,
		}),
		null,
	);
});
