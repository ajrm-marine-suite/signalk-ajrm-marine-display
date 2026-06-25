import assert from "node:assert/strict";
import test from "node:test";
import {
	CHART_URL_FIELDS,
	chartUrl,
	chartZoom,
	numericChartZoom,
} from "../src/web/assets/scripts/chart-resource-url.mjs";

test("chartUrl keeps the established URL field priority", () => {
	assert.deepEqual(CHART_URL_FIELDS, ["tilemapUrl", "url", "tileUrl", "href"]);
	assert.equal(
		chartUrl({
			tilemapUrl: "/tilemap",
			url: "/url",
			tileUrl: "/tile-url",
			href: "/href",
		}),
		"/tilemap",
	);
});

test("numericChartZoom preserves finite zooms and falls back on invalid values", () => {
	assert.equal(numericChartZoom("12", 0), 12);
	assert.equal(numericChartZoom("bad", 24), 24);
	assert.equal(numericChartZoom(undefined, 24), 24);
});

test("chartZoom accepts lower and camel-case zoom field variants", () => {
	assert.deepEqual(chartZoom({ minzoom: "7", maxZoom: "14" }), {
		min: 7,
		max: 14,
	});
});
