import assert from "node:assert/strict";
import test from "node:test";
import {
	clearAnnouncementLogPath,
	encounterSettingsBody,
	encounterSettingsPath,
	soundCheckPath,
} from "../src/web/assets/scripts/speech-output-ui-state.mjs";

test("Display sends controls directly to their authoritative providers", () => {
	assert.equal(
		encounterSettingsPath(),
		"/plugins/signalk-ajrm-marine-traffic/commands/audio",
	);
	assert.equal(
		soundCheckPath(),
		"/plugins/signalk-ajrm-marine-audio/sound-check",
	);
	assert.equal(
		clearAnnouncementLogPath(),
		"/plugins/signalk-ajrm-marine-notifications/history/clear",
	);
});

test("Display writes only Traffic-owned audio policy fields", () => {
	assert.deepEqual(
		encounterSettingsBody({
			allWellEnabled: { checked: true },
			allWellIntervalMinutes: { value: "12" },
			allWellMessage: { value: "All systems normal." },
		}),
		{
			allWellEnabled: true,
			allWellIntervalMinutes: 12,
			allWellMessage: "All systems normal.",
		},
	);
});
