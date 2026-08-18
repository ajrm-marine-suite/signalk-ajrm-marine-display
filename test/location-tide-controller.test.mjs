/**
 * Verifies Tide Resolver reason labels and the deterministic Display curve.
 */

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import {
	TIDE_SELECTION_LABELS,
	anchoringSuggestionText,
	springNeapEstimate,
	tideMapContext,
	tideCurveEventsForDays,
	tideGraphDays,
	tideStatusUrl,
	tideCurveSvg,
	tideEventTimeLabel,
} from "../src/web/assets/scripts/location-tide-controller.mjs";

test("tidal selection reasons are translated into skipper-facing explanations", () => {
	assert.match(TIDE_SELECTION_LABELS.explicitTideLocationRef, /Explicit tidal port/);
	assert.match(TIDE_SELECTION_LABELS.containingRegionAssignment, /containing tidal region/);
	assert.match(TIDE_SELECTION_LABELS.nearestPortInTidalRegion, /Nearest suitable port/);
	assert.match(TIDE_SELECTION_LABELS.manualPinnedOverride, /Manually pinned/);
});

test("spring-neap estimate reports elapsed and remaining phase days", () => {
	const spring = springNeapEstimate("2000-01-06T18:15:00Z");
	assert.equal(spring.status, "Near spring tides");
	assert.equal(spring.previous, "spring");
	assert.equal(spring.daysAfter, 0);
	assert.match(spring.timing, /0\.0 days after spring/);
	assert.match(spring.timing, /7\.4 days before neap/);

	const easing = springNeapEstimate("2000-01-09T18:15:00Z");
	assert.equal(easing.status, "Easing toward neap tides");
	assert.match(easing.timing, /3\.0 days after spring/);

	const building = springNeapEstimate("2000-01-16T18:15:00Z");
	assert.equal(building.status, "Building toward spring tides");
	assert.equal(building.previous, "neap");
});

test("explicit UTC tide instants display as UK civil time across daylight saving", () => {
	assert.match(tideEventTimeLabel("2026-08-18T08:53:00.000Z", "en-GB", "Europe/London"), /09:53 BST/);
	assert.match(tideEventTimeLabel("2026-12-18T08:53:00.000Z", "en-GB", "Europe/London"), /08:53 GMT/);
});

test("tide graph duration defaults to seven days and rejects invalid stored values", () => {
	assert.equal(tideGraphDays(null), 7);
	assert.equal(tideGraphDays("3"), 3);
	assert.equal(tideGraphDays("9"), 7);
});

test("tide graph duration keeps the preceding extreme and selected future days", () => {
	const events = [
		{ at: "2026-08-17T18:00:00Z", heightM: 1 },
		{ at: "2026-08-18T06:00:00Z", heightM: 5 },
		{ at: "2026-08-19T06:00:00Z", heightM: 4.8 },
		{ at: "2026-08-20T06:00:00Z", heightM: 4.6 },
	];
	assert.deepEqual(
		tideCurveEventsForDays(events, "2026-08-18T00:00:00Z", 1).map((event) => event.at),
		["2026-08-17T18:00:00Z", "2026-08-18T06:00:00Z"],
	);
});

test("the hidden tide launcher leaves modal ownership to the controller", async () => {
	const html = await fs.readFile(new URL("../src/web/index.html", import.meta.url), "utf8");
	const launcher = html.match(/<button[\s\S]*?id="buttonOpenTides"[\s\S]*?<\/button>/)?.[0] || "";
	assert.ok(launcher);
	assert.doesNotMatch(launcher, /data-bs-(?:toggle|target)/);
	assert.match(html, /id="selectTideGraphDays"/);
	assert.match(html, /id="tideDetailsTab"[\s\S]*?data-bs-target="#tideDetailsPane"/);
	assert.match(html, /id="tideGraphTab"[\s\S]*?data-bs-target="#tideGraphPane"/);
	assert.match(html, /id="tideDetailsPane"[\s\S]*?id="tideHeightNow"/);
	assert.match(html, /id="tideGraphPane"[\s\S]*?id="tideCurve"/);
	assert.match(html, /modal-dialog[^\"]*ajrm-tide-modal-dialog/);
});

test("tide requests use the visible chart centre as explicit selection context", () => {
	const context = tideMapContext({ getCenter: () => ({ lat: 56.27224, lng: -5.637656 }) });
	assert.deepEqual(context, { latitude: 56.27224, longitude: -5.637656 });
	const url = new URL(tideStatusUrl(context), "https://example.test");
	assert.equal(url.searchParams.get("latitude"), "56.27224");
	assert.equal(url.searchParams.get("longitude"), "-5.637656");
});

test("invalid chart centres do not create misleading tide coordinates", () => {
	assert.deepEqual(tideMapContext({ getCenter: () => ({ lat: 100, lng: -5 }) }), {});
	assert.equal(tideStatusUrl({}), "/plugins/signalk-ajrm-marine-location-editor/tides/status");
});

test("anchoring prompt requires an explicit current backend suggestion", () => {
	assert.match(anchoringSuggestionText({
		state: "suggested", suggestionId: "suggestion", location: { name: "North Bay" },
	}), /stationary at North Bay/);
	assert.equal(anchoringSuggestionText({ state: "observing", location: { name: "North Bay" } }), "");
});

test("tide curve renders labelled extremes and the calculation reference", () => {
	const svg = tideCurveSvg([
		{ at: "2026-08-18T00:00:00Z", type: "low", heightM: 1 },
		{ at: "2026-08-18T06:00:00Z", type: "high", heightM: 5 },
		{ at: "2026-08-18T12:00:00Z", type: "low", heightM: 1.2 },
	], "2026-08-18T03:00:00Z");
	assert.match(svg, /aria-label="Predicted tide curve"/);
	assert.match(svg, /class="curve"/);
	assert.match(svg, />Now</);
	assert.match(svg, />5\.0 m</);
	assert.match(svg, /class="extreme extreme-low"/);
	assert.match(svg, /class="extreme extreme-high"/);
	assert.equal((svg.match(/<tspan /g) || []).length, 6);
	assert.equal((svg.match(/dy="16"/g) || []).length, 3);
	const lowPointY = Number(svg.match(/extreme-low">\s*<circle[^>]* cy="([0-9.]+)"/)?.[1]);
	const lowLabelY = Number(svg.match(/extreme-low">[\s\S]*?extreme-height"[^>]* y="([0-9.]+)"/)?.[1]);
	const highPointY = Number(svg.match(/extreme-high">\s*<circle[^>]* cy="([0-9.]+)"/)?.[1]);
	const highLabelY = Number(svg.match(/extreme-high">[\s\S]*?extreme-height"[^>]* y="([0-9.]+)"/)?.[1]);
	assert.ok(lowLabelY > lowPointY, "low-water height should appear below its trough");
	assert.ok(highLabelY < highPointY, "high-water height should appear above its peak");
});

test("tide curve has an explicit empty state", () => {
	assert.match(tideCurveSvg([]), /No tidal curve is available/);
});
