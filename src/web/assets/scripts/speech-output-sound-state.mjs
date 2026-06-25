import { browserSpeechAvailable, speakBrowserMessage } from "./browser-speech-state.mjs";
import { sendSoundStateAnnouncement } from "./speech-output-requests.mjs";
import { soundStateAnnouncementMessage } from "./speech-output-ui-state.mjs";

export function shouldSpeakSoundStateInBrowser({
	browserChecked,
	windowObject = globalThis.window,
}) {
	return Boolean(browserChecked) && browserSpeechAvailable(windowObject);
}

export async function announceSoundState({
	controls,
	pluginId,
	fetchFn,
	muted: requestedMuted,
	windowObject = globalThis.window,
	Utterance = globalThis.SpeechSynthesisUtterance,
}) {
	const muted =
		typeof requestedMuted === "boolean"
			? requestedMuted
			: controls.muted.checked === true;
	const message = soundStateAnnouncementMessage({ muted });
	const browserSpoken = shouldSpeakSoundStateInBrowser({
		browserChecked: controls.browser.checked,
		windowObject,
	})
		? speakBrowserMessage({
				message,
				windowObject,
				Utterance,
			})
		: false;
	await sendSoundStateAnnouncement({ fetchFn, pluginId, muted });
	return { browserSpoken, message, muted };
}
