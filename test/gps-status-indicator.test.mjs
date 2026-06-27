import assert from "node:assert/strict";
import test from "node:test";
import { classifyGpsStatus } from "../src/web/assets/scripts/gps-status-indicator.mjs";

test("GPS status indicator shows OK only for trusted valid fixes", () => {
	assert.deepEqual(
		classifyGpsStatus({
			state: {
				trust: "normal",
				gps: { fixValid: true },
			},
		}),
		{
			kind: "ok",
			label: "GPS OK",
			title: "GPS received OK",
		},
	);
});

test("GPS status indicator shows alert for missing fixes", () => {
	assert.deepEqual(
		classifyGpsStatus({
			state: {
				trust: "normal",
				gps: { fixValid: false },
			},
		}),
		{
			kind: "alert",
			label: "GPS LOST",
			title: "GPS position is missing or invalid",
		},
	);
});

test("GPS status indicator shows unknown when the source is unavailable", () => {
	assert.deepEqual(classifyGpsStatus(null), {
		kind: "unknown",
		label: "GPS ?",
		title: "GPS status unknown",
	});
});
