import assert from "node:assert/strict";
import test from "node:test";

import { speakAndLogBrowserSoundCheck } from "../src/web/assets/scripts/browser-speech-actions.mjs";
import { announceSoundState } from "../src/web/assets/scripts/speech-output-sound-state.mjs";

class Utterance {
	constructor(text) {
		this.text = text;
	}
}

function speechWindow() {
	const spoken = [];
	return {
		spoken,
		speechSynthesis: {
			cancelled: 0,
			cancel() {
				this.cancelled += 1;
			},
			speak(utterance) {
				spoken.push(utterance.text);
			},
		},
	};
}

function okFetch() {
	return Promise.resolve({
		ok: true,
		json: async () => ({}),
	});
}

test("browser sound check queues without interrupting current speech", () => {
	const windowObject = speechWindow();

	const spoken = speakAndLogBrowserSoundCheck({
		fetchFn: okFetch,
		pluginId: "ajrmMarineDisplay",
		message: "Sound Check. Testing 1, 2, 3.",
		windowObject,
		Utterance,
	});

	assert.equal(spoken, true);
	assert.deepEqual(windowObject.spoken, ["Sound Check. Testing 1, 2, 3."]);
	assert.equal(windowObject.speechSynthesis.cancelled, 0);
});

test("browser sound state announcement queues without interrupting current speech", async () => {
	const windowObject = speechWindow();

	const result = await announceSoundState({
		controls: {
			browser: { checked: true },
			muted: { checked: false },
		},
		pluginId: "ajrmMarineDisplay",
		fetchFn: okFetch,
		muted: false,
		windowObject,
		Utterance,
	});

	assert.equal(result.browserSpoken, true);
	assert.deepEqual(windowObject.spoken, ["Sounds enabled."]);
	assert.equal(windowObject.speechSynthesis.cancelled, 0);
});
