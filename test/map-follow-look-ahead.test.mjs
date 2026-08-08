/**
 * Verifies Display's adapter for the shared own-vessel map look-ahead contract.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
	mapFollowCenterForTarget,
	normalizeMapFollowLookAheadPercent,
} from "../src/web/assets/scripts/map-follow-look-ahead.mjs";

test("Display passes its Signal K radian COG to shared map look-ahead geometry", () => {
	const map = {
		getSize: () => ({ x: 1000, y: 600 }),
		getZoom: () => 12,
		project: () => ({ x: 5000, y: 4000 }),
		unproject: (point) => point,
	};
	assert.deepEqual(mapFollowCenterForTarget({
		map,
		target: {
			latitude: 55.5,
			longitude: -5.5,
			cog: 0,
		},
		lookAheadPercent: 66,
	}), { x: 5000, y: 3904 });
});

test("Display look-ahead configuration clamps to the supported visible range", () => {
	assert.equal(normalizeMapFollowLookAheadPercent(null), 66);
	assert.equal(normalizeMapFollowLookAheadPercent(50), 50);
	assert.equal(normalizeMapFollowLookAheadPercent(90), 80);
});
