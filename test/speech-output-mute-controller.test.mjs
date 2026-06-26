import assert from "node:assert/strict";
import test from "node:test";

import { createSpeechOutputMuteController } from "../src/web/assets/scripts/speech-output-mute-controller.mjs";

function control({ checked = false, textContent = "" } = {}) {
	return {
		checked,
		classList: {
			add() {},
			remove() {},
			toggle() {},
		},
		textContent,
	};
}

function controls({ muted = false, automute = false } = {}) {
	return {
		muted: control({ checked: muted }),
		automute: control({ checked: automute }),
		muteButton: control(),
		muteStatus: control(),
		audioModeAuto: control(),
		audioModeOn: control(),
		audioModeOff: control(),
		audioModeStatus: control(),
	};
}

test("Display audio mode Auto enables stationary automute without manual mute", async () => {
	const view = controls({ muted: true, automute: false });
	let saved = null;
	const controller = createSpeechOutputMuteController({
		controls: view,
		saveSettings: async () => {
			saved = {
				muted: view.muted.checked,
				automute: view.automute.checked,
			};
			return saved;
		},
	});

	await controller.handleAudioModeChange("auto");

	assert.deepEqual(saved, { muted: false, automute: true });
	assert.equal(view.audioModeAuto.checked, true);
	assert.equal(view.audioModeOn.checked, false);
	assert.equal(view.audioModeOff.checked, false);
});

test("Display audio mode On enables sound and disables stationary automute", async () => {
	const view = controls({ muted: true, automute: true });
	const controller = createSpeechOutputMuteController({
		controls: view,
		saveSettings: async () => true,
	});

	await controller.handleAudioModeChange("on");

	assert.equal(view.muted.checked, false);
	assert.equal(view.automute.checked, false);
	assert.equal(view.audioModeAuto.checked, false);
	assert.equal(view.audioModeOn.checked, true);
	assert.equal(view.audioModeOff.checked, false);
});

test("Display audio mode Off manually mutes and disables stationary automute", async () => {
	const view = controls({ muted: false, automute: true });
	const controller = createSpeechOutputMuteController({
		controls: view,
		saveSettings: async () => true,
	});

	await controller.handleAudioModeChange("off");

	assert.equal(view.muted.checked, true);
	assert.equal(view.automute.checked, false);
	assert.equal(view.audioModeAuto.checked, false);
	assert.equal(view.audioModeOn.checked, false);
	assert.equal(view.audioModeOff.checked, true);
});
