/**
 * Verifies Tide Resolver reason labels and the deterministic Display curve.
 */

import assert from "node:assert/strict";
import test from "node:test";
import {
	TIDE_SELECTION_LABELS,
	anchoringSuggestionText,
	tideCurveSvg,
} from "../src/web/assets/scripts/location-tide-controller.mjs";

test("tidal selection reasons are translated into skipper-facing explanations", () => {
	assert.match(TIDE_SELECTION_LABELS.explicitTideLocationRef, /Explicit tidal port/);
	assert.match(TIDE_SELECTION_LABELS.containingRegionAssignment, /containing tidal region/);
	assert.match(TIDE_SELECTION_LABELS.nearestPortInTidalRegion, /Nearest suitable port/);
	assert.match(TIDE_SELECTION_LABELS.manualPinnedOverride, /Manually pinned/);
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
});

test("tide curve has an explicit empty state", () => {
	assert.match(tideCurveSvg([]), /No tidal curve is available/);
});
