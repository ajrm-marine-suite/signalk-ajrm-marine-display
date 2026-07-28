import assert from "node:assert/strict";
import test from "node:test";

import { speakBrowserAlertsForOutput } from "../src/web/assets/scripts/speech-output-browser-alerts.mjs";

class Utterance {
	constructor(text) {
		this.text = text;
	}
}

function speechWindow({ visible = true, focused = true, speaking = false } = {}) {
	const spoken = [];
	return {
		document: {
			visibilityState: visible ? "visible" : "hidden",
			hasFocus: () => focused,
		},
		speechSynthesis: {
			speaking,
			pending: false,
			cancelled: 0,
			cancel() {
				this.cancelled += 1;
			},
			speak(utterance) {
				spoken.push(utterance.text);
			},
		},
		spoken,
	};
}

function controls() {
	return {
		muted: { checked: false },
		browser: { checked: true },
	};
}

function event(id, overrides = {}) {
	return {
		id,
		message: `Visual ${id}`,
		audioMessage: `Spoken ${id}`,
		state: "warn",
		shouldAnnounce: true,
		audioExpiresAt: "2026-07-28T16:01:30.000Z",
		...overrides,
	};
}

const fetchOk = async () => ({ ok: true, json: async () => ({}) });
const eventTime = () => Date.parse("2026-07-28T16:01:00.000Z");

test("background browser speech is discarded and any native queue is cancelled", async () => {
	const windowObject = speechWindow({ visible: false });
	const spokenAlerts = new Map();
	await speakBrowserAlertsForOutput({
		events: [event("kerry-1")],
		controls: controls(),
		browserSpokenAlerts: spokenAlerts,
		pluginId: "ajrmMarineDisplay",
		fetchFn: fetchOk,
		windowObject,
		Utterance,
		now: eventTime,
	});
	assert.deepEqual(windowObject.spoken, []);
	assert.equal(windowObject.speechSynthesis.cancelled, 1);
	assert.equal(spokenAlerts.get("kerry-1").disposition, "discarded-background");
});

test("expired browser announcement is not spoken when focus returns", async () => {
	const windowObject = speechWindow();
	const spokenAlerts = new Map();
	await speakBrowserAlertsForOutput({
		events: [event("kerry-old")],
		controls: controls(),
		browserSpokenAlerts: spokenAlerts,
		pluginId: "ajrmMarineDisplay",
		fetchFn: fetchOk,
		windowObject,
		Utterance,
		now: () => Date.parse("2026-07-28T16:02:00.000Z"),
	});
	assert.deepEqual(windowObject.spoken, []);
	assert.equal(spokenAlerts.get("kerry-old").disposition, "discarded-expired");
});

test("foreground browser queues only one fresh announcement while speech is idle", async () => {
	const windowObject = speechWindow();
	const spokenAlerts = new Map();
	await speakBrowserAlertsForOutput({
		events: [event("first"), event("second")],
		controls: controls(),
		browserSpokenAlerts: spokenAlerts,
		pluginId: "ajrmMarineDisplay",
		fetchFn: fetchOk,
		windowObject,
		Utterance,
		now: eventTime,
	});
	assert.deepEqual(windowObject.spoken, ["Spoken first"]);
	assert.equal(spokenAlerts.has("first"), true);
	assert.equal(spokenAlerts.has("second"), false);
});

test("busy browser speech engine does not accumulate another utterance", async () => {
	const windowObject = speechWindow({ speaking: true });
	const spokenAlerts = new Map();
	await speakBrowserAlertsForOutput({
		events: [event("deferred")],
		controls: controls(),
		browserSpokenAlerts: spokenAlerts,
		pluginId: "ajrmMarineDisplay",
		fetchFn: fetchOk,
		windowObject,
		Utterance,
		now: eventTime,
	});
	assert.deepEqual(windowObject.spoken, []);
	assert.equal(spokenAlerts.has("deferred"), false);
});
