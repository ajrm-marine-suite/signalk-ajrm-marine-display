import assert from "node:assert/strict";
import test from "node:test";
import {
	activeRouteFingerprint,
	bearingDegrees,
	normalizeRouteStyle,
	routeArrowSegments,
	routeArrowGlyphRotation,
	routeLatLngs,
	routeSummary,
} from "../src/web/assets/scripts/route-rendering.mjs";

const active = {
	resourceId: "id",
	revision: 2,
	reversed: false,
	changedAt: "2026-08-03T10:00:00.000Z",
	resource: {
		name: "Passage",
		distance: 3704,
		feature: {
			geometry: {
				coordinates: [[-5, 56], [-4.9, 56.1], [-4.8, 56.2]],
			},
		},
	},
};

test("route rendering converts GeoJSON lon/lat to Leaflet lat/lon", () => {
	assert.deepEqual(routeLatLngs(active), [[56, -5], [56.1, -4.9], [56.2, -4.8]]);
	assert.equal(routeArrowSegments(routeLatLngs(active)).length, 2);
	assert.ok(bearingDegrees([56, -5], [56.1, -4.9]) > 0);
});

test("route arrow glyph rotation converts compass bearing to a right-pointing glyph", () => {
	assert.equal(bearingDegrees([56, -5], [57, -5]), 0);
	assert.equal(routeArrowGlyphRotation(0), -90);
	assert.equal(routeArrowGlyphRotation(90), 0);
	assert.equal(routeArrowSegments([[56, -5], [57, -5]])[0].rotation, -90);
});

test("route style and active route summary are bounded", () => {
	assert.deepEqual(normalizeRouteStyle({ color: "#ABCDEF", weight: 99 }), {
		color: "#abcdef",
		weight: 12,
	});
	assert.deepEqual(routeSummary(active), {
		title: "Passage",
		details: "3 points · 2.0 NM · forward",
	});
	assert.match(activeRouteFingerprint(active), /^id:2:forward:/);
});
