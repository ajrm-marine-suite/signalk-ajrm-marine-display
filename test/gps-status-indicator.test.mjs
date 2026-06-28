import assert from "node:assert/strict";
import test from "node:test";
import {
	classifyGpsStatus,
	classifySignalKGpsStatus,
} from "../src/web/assets/scripts/gps-status-indicator.mjs";

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

test("GPS status indicator falls back to fresh Signal K own-vessel position", () => {
	assert.deepEqual(
		classifySignalKGpsStatus(
			{
				navigation: {
					position: {
						value: {
							latitude: 56.2,
							longitude: -5.5,
						},
						timestamp: "2026-06-28T14:00:00.000Z",
					},
					gnss: {
						methodQuality: { value: "GNSS Fix" },
						satellites: { value: 8 },
					},
				},
			},
			{
				now: Date.parse("2026-06-28T14:00:10.000Z"),
				maxAgeMs: 30_000,
			},
		),
		{
			kind: "ok",
			label: "GPS OK",
			title: "GPS received OK - GNSS Fix - 8 satellites",
		},
	);
});

test("GPS status indicator treats missing fallback position as lost", () => {
	assert.deepEqual(classifySignalKGpsStatus({ navigation: {} }), {
		kind: "alert",
		label: "GPS LOST",
		title: "GPS position is missing or invalid",
	});
});

test("GPS status indicator treats stale fallback position as stale", () => {
	assert.deepEqual(
		classifySignalKGpsStatus(
			{
				navigation: {
					position: {
						value: {
							latitude: 56.2,
							longitude: -5.5,
						},
						timestamp: "2026-06-28T14:00:00.000Z",
					},
				},
			},
			{
				now: Date.parse("2026-06-28T14:01:00.000Z"),
				maxAgeMs: 30_000,
			},
		),
		{
			kind: "alert",
			label: "GPS STALE",
			title: "GPS position is stale",
		},
	);
});
