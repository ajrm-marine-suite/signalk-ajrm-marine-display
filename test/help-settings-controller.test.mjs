import assert from "node:assert/strict";
import test from "node:test";

import {
	createHelpSettingsController,
	escapeHelpSettingsHtml,
	formatHelpSettingsDistanceMeters,
	formatHelpSettingsDuration,
	formatHelpSettingsSpeed,
	helpSettingsRepeatIntervalsPath,
	renderHelpSettingsHtml,
} from "../src/web/assets/scripts/help-settings-controller.mjs";

function element({ checked = true } = {}) {
	const listeners = new Map();
	return {
		checked,
		innerHTML: "",
		textContent: "",
		addEventListener(type, handler) {
			listeners.set(type, handler);
		},
		trigger(type, event = {}) {
			listeners.get(type)?.(event);
		},
	};
}

function response(data, ok = true, status = 200) {
	return { ok, status, json: async () => data };
}

function profilesFixture() {
	return {
		current: "coastal",
		coastal: {
			cpaSensitivity: 2,
			tcpaLookahead: 2,
			repeatSensitivity: 2,
			warning: {
				cpa: 50,
				tcpa: 120,
				speed: 0.5,
				bySize: {
					small: { cpa: 100, tcpa: 180, speed: 1.2 },
				},
			},
			danger: { cpa: 40, tcpa: 60, speed: 3 },
		},
		vesselSize: {
			smallMaxLengthMeters: 15,
			mediumMaxLengthMeters: 50,
			unknownLengthCategory: "small",
		},
	};
}

test("help settings helpers format and escape display values", () => {
	assert.equal(escapeHelpSettingsHtml("<AIS & GPS>"), "&lt;AIS &amp; GPS&gt;");
	assert.equal(formatHelpSettingsDuration(45), "45 sec");
	assert.equal(formatHelpSettingsDuration(180), "3 min");
	assert.equal(formatHelpSettingsDistanceMeters(93), "93 m");
	assert.equal(formatHelpSettingsDistanceMeters(1.25 * 1852), "1.25 NM");
	assert.equal(formatHelpSettingsSpeed(1.234), "1.2 kn");
	assert.equal(
		helpSettingsRepeatIntervalsPath("signalk-ajrm-marine-display", 123),
		"/signalk/v1/api/ajrmMarineDisplay/repeatIntervals?ts=123",
	);
});

test("help settings renderer shows active profile, limits and auto-profile status", () => {
	const html = renderHelpSettingsHtml(
		profilesFixture(),
		{ message: "Coastal <selected>", options: { enabled: false } },
		{ alert: 180, warning: 120, alarm: 60, emergency: 30 },
	);

	assert.match(html, /Coastal &lt;selected&gt;/);
	assert.match(html, /Auto Profile Switch[\s\S]*Off/);
	assert.match(html, /Small up to[\s\S]*15 m/);
	assert.match(html, /200 m/);
	assert.match(html, /6 min/);
	assert.match(html, /Advisory 1 min/);
	assert.match(html, /Alarm 30 sec; emergency 15 sec/);
});

test("help settings load uses shared UI state before fetching UI state route", async () => {
	const calls = [];
	const content = element();
	const status = element();
	const controller = createHelpSettingsController({
		modal: element(),
		refreshButton: element(),
		status,
		content,
		currentSettingsTab: element(),
		windowObject: {
			ajrmMarineLatestUiState: {
				autoProfileStatus: {
					message: "Shared harbour profile",
					options: { enabled: true },
				},
			},
		},
		now: () => 123,
		fetchFn: async (url) => {
			calls.push(url);
			if (url.includes("/getCollisionProfiles")) {
				return response(profilesFixture());
			}
			if (url.includes("/repeatIntervals")) {
				return response({ alert: 180, warning: 120, alarm: 60, emergency: 30 });
			}
			throw new Error(`Unexpected request: ${url}`);
		},
	});

	await controller.loadHelpSettings();

	assert.deepEqual(calls, [
		"/signalk/v1/api/ajrmMarineDisplay/getCollisionProfiles?ts=123",
		"/signalk/v1/api/ajrmMarineDisplay/repeatIntervals?ts=123",
	]);
	assert.match(content.innerHTML, /Shared harbour profile/);
	assert.match(status.textContent, /^Updated /);
});

test("help settings load fetches UI state when no shared snapshot is available", async () => {
	const calls = [];
	const content = element();
	const controller = createHelpSettingsController({
		modal: element(),
		refreshButton: element(),
		status: element(),
		content,
		currentSettingsTab: element(),
		windowObject: {},
		now: () => 456,
		fetchFn: async (url) => {
			calls.push(url);
			if (url.includes("/getCollisionProfiles")) {
				return response(profilesFixture());
			}
			if (url.endsWith("/uiState")) {
				return response({
					autoProfileStatus: {
						message: "Fetched coastal profile",
						options: { enabled: true },
					},
				});
			}
			if (url.includes("/repeatIntervals")) {
				return response({ alert: 180, warning: 120, alarm: 60, emergency: 30 });
			}
			throw new Error(`Unexpected request: ${url}`);
		},
	});

	await controller.loadHelpSettings();

	assert.deepEqual(calls, [
		"/signalk/v1/api/ajrmMarineDisplay/getCollisionProfiles?ts=456",
		"/signalk/v1/api/ajrmMarineDisplay/uiState",
		"/signalk/v1/api/ajrmMarineDisplay/repeatIntervals?ts=456",
	]);
	assert.match(content.innerHTML, /Fetched coastal profile/);
});
