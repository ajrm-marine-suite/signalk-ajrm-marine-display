import assert from "node:assert/strict";
import test from "node:test";
import { updateDerivedData, toRadians } from "../src/shared/ais-utils.mjs";

test("target XY conversion uses midpoint latitude for east-west scale", () => {
	const now = Date.now();
	const selfTarget = {
		mmsi: "self",
		latitude: 50,
		longitude: -5,
		sog: 0,
		cog: 0,
		lastSeenDate: now,
	};
	const target = {
		mmsi: "235000001",
		latitude: 60,
		longitude: -4,
		sog: 0,
		cog: 0,
		lastSeenDate: now,
	};

	updateDerivedData({
		targets: new Map([["235000001", target]]),
		selfTarget,
		maximumTargetRange: 2000,
		targetMaxAge: 60,
	});

	const expectedTargetX = -4 * 111120 * Math.cos(toRadians(55));
	assert.ok(Math.abs(target.x - expectedTargetX) < 0.000001);
});
