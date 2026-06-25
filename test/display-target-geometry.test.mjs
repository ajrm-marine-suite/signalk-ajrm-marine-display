import assert from "node:assert/strict";
import test from "node:test";
import { applyDisplayTargetGeometry } from "../src/web/assets/scripts/display-target-geometry.mjs";

test("standard Signal K targets remain drawable without calculating safety state", () => {
	const self = {
		mmsi: "self",
		latitude: 56.2,
		longitude: -5.5,
		sog: 2,
		cog: 1,
		lastSeenDate: new Date("2026-06-20T12:00:00.000Z"),
	};
	const target = {
		mmsi: "235000001",
		latitude: 56.21,
		longitude: -5.49,
		lastSeenDate: new Date("2026-06-20T12:00:00.000Z"),
	};
	const targets = new Map([
		["self", self],
		["235000001", target],
	]);
	applyDisplayTargetGeometry({
		targets,
		selfMmsi: "self",
		now: Date.parse("2026-06-20T12:00:05.000Z"),
	});
	assert.equal(self.isValid, true);
	assert.equal(target.isValid, true);
	assert.ok(target.range > 0);
	assert.match(target.rangeFormatted, /(m|NM)$/);
	assert.equal(target.alarmState, undefined);
	assert.equal(target.cpa, undefined);
});

test("fallback geometry formatting follows projected distance unit", () => {
	const self = {
		mmsi: "self",
		latitude: 56.2,
		longitude: -5.5,
		lastSeenDate: new Date("2026-06-20T12:00:00.000Z"),
	};
	const target = {
		mmsi: "235000001",
		latitude: 56.2,
		longitude: -5.485,
		distanceUnit: "ft",
		lastSeenDate: new Date("2026-06-20T12:00:00.000Z"),
	};
	const targets = new Map([
		["self", self],
		["235000001", target],
	]);
	applyDisplayTargetGeometry({
		targets,
		selfMmsi: "self",
		now: Date.parse("2026-06-20T12:00:05.000Z"),
	});
	assert.ok(target.range > 300);
	assert.match(target.rangeFormatted, / mi$/);
});
