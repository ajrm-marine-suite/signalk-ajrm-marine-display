import assert from "node:assert/strict";
import test from "node:test";

import {
	createAppRefreshController,
	replayStatusFromAjrmMarineLogger,
	replayStatusFromSignalKVessels,
} from "../src/web/assets/scripts/app-refresh-controller.mjs";

test("replay status follows the explicit active flag without requiring a timestamp", () => {
	const status = replayStatusFromAjrmMarineLogger({
		playback: {
			active: true,
			fileName: "voyage.jsonl",
		},
	});

	assert.equal(status.active, true);
	assert.equal(status.fileName, "voyage.jsonl");
	assert.equal(status.replayTimeMs, null);
});

test("replay status reads explicit Logger playback state from Signal K vessels", () => {
	const status = replayStatusFromSignalKVessels({
		self: {
			plugins: {
				ajrmMarineLogger: {
					playback: {
						value: {
							active: true,
							paused: true,
							current: "2026-07-08T12:00:00.000Z",
							rate: 4,
						},
					},
				},
			},
		},
	});

	assert.equal(status.active, true);
	assert.equal(status.paused, true);
	assert.equal(status.rate, 4);
	assert.equal(status.replayTimeMs, Date.parse("2026-07-08T12:00:00.000Z"));
});

test("refresh debug sample records simulator-relevant counts and phases", async () => {
	const targets = new Map();
	const samples = [];
	const responses = {
		"/signalk/v1/api/vessels": {
			self: {
				mmsi: { value: "self" },
				navigation: {
					position: {
						value: { latitude: 56, longitude: -5 },
						timestamp: new Date().toISOString(),
					},
				},
			},
		},
		"/signalk/v1/api/atons": {},
	};
	const refreshDebug = {
		start() {
			const phases = {};
			return {
				phase(name, fn) {
					phases[name] = 1;
					return fn();
				},
				finish(sample) {
					samples.push({ ...sample, phases });
				},
			};
		},
	};
	const controller = createAppRefreshController({
		map: {
			attributionControl: { setPrefix() {} },
			eachLayer() {},
		},
		getHttpResponse: async (url) => {
			if (url.startsWith("/signalk/v1/api/ajrmMarineDisplay/getTargets")) {
				return {};
			}
			if (url === "/signalk/v1/api/ajrmMarineDisplay/uiState") return {};
			if (Object.hasOwn(responses, url)) return responses[url];
			throw new Error(`Unexpected URL ${url}`);
		},
		targets,
		getSelfMmsi: () => "self",
		setSelfTarget() {},
		targetSilence: { applyInitialMuteData() {} },
		serverAlertEvents: { refresh: async () => {} },
		alertPopup: { show() {} },
		initialPluginTargets: {},
		updateUI() {},
		ageOutOldTargets: () => 0,
		removeMissingTargets() {},
		resetTargetCounts() {},
		getAlarmTargetCount: () => 0,
		getDebugSnapshot: () => ({ boatMarkers: 1, overlays: { cpaLimitRings: 0 } }),
		targetMaxAge: 1800,
		ageOutEnabled: true,
		showAlarmsInterval: 60000,
		replayStatusControls: {},
		connectionStatusControls: {},
		publishUiState() {},
		projectionFallbackEnabled: () => false,
		refreshDebug,
	});

	await controller.refresh();

	assert.equal(samples.length, 1);
	assert.equal(samples[0].counts.vessels, 1);
	assert.equal(samples[0].counts.targets, 1);
	assert.equal(samples[0].counts.boatMarkers, 1);
	assert.equal(samples[0].removedMissing, 0);
	assert.equal(samples[0].replayActive, false);
	assert.equal(samples[0].phases["fetch-vessels"], 1);
	assert.equal(samples[0].phases["render-ui"], 1);
});
