import assert from "node:assert/strict";
import test from "node:test";

import {
	footprintLatLngs,
	vesselFootprint,
} from "../src/shared/vessel-footprint.mjs";

const OPTIONS = {
	assumedClassALengthMeters: 100,
	assumedBeamToLengthRatio: 0.1,
};

function footprintSpansMeters(target) {
	const points = footprintLatLngs(target, OPTIONS);
	const latitudes = points.map(([latitude]) => latitude);
	const longitudes = points.map(([, longitude]) => longitude);
	return {
		northSouth:
			(Math.max(...latitudes) - Math.min(...latitudes)) * 111120,
		eastWest:
			(Math.max(...longitudes) - Math.min(...longitudes)) * 111120,
	};
}

test("missing heading falls back to course over ground for footprint rotation", () => {
	const target = {
		aisClass: "A",
		latitude: 0,
		longitude: 0,
		hdg: null,
		cog: Math.PI / 2,
	};
	const footprint = vesselFootprint(target, OPTIONS);
	const spans = footprintSpansMeters(target);

	assert.equal(footprint.heading, Math.PI / 2);
	assert.ok(spans.eastWest > spans.northSouth * 5);
});

test("explicit north heading takes precedence over an easterly course", () => {
	const target = {
		aisClass: "A",
		latitude: 0,
		longitude: 0,
		hdg: 0,
		cog: Math.PI / 2,
	};
	const footprint = vesselFootprint(target, OPTIONS);
	const spans = footprintSpansMeters(target);

	assert.equal(footprint.heading, 0);
	assert.ok(spans.northSouth > spans.eastWest * 5);
});

test("finite heading takes precedence over course for footprint rotation", () => {
	const target = {
		aisClass: "A",
		latitude: 0,
		longitude: 0,
		hdg: Math.PI / 2,
		cog: 0,
	};
	const footprint = vesselFootprint(target, OPTIONS);
	const spans = footprintSpansMeters(target);

	assert.equal(footprint.heading, Math.PI / 2);
	assert.ok(spans.eastWest > spans.northSouth * 5);
});
