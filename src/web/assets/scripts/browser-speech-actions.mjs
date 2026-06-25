import {
	eventBrowserLogBody,
	soundCheckBrowserLogBody,
	speakBrowserMessage,
} from "./browser-speech-state.mjs";
import { postAnnouncementLog } from "./speech-output-requests.mjs";

export function speakAndLogBrowserSoundCheck({
	fetchFn,
	pluginId,
	message,
	windowObject = globalThis.window,
	Utterance = globalThis.SpeechSynthesisUtterance,
}) {
	const spoken = speakBrowserMessage({
		message,
		windowObject,
		Utterance,
	});
	if (!spoken) return false;
	postAnnouncementLog({
		fetchFn,
		pluginId,
		body: soundCheckBrowserLogBody(message),
	}).catch(() => {});
	return true;
}

export function speakAndLogBrowserAlert({
	fetchFn,
	pluginId,
	event,
	windowObject = globalThis.window,
	Utterance = globalThis.SpeechSynthesisUtterance,
}) {
	const spoken = speakBrowserMessage({
		message: event?.message,
		windowObject,
		Utterance,
	});
	if (!spoken) return false;
	postAnnouncementLog({
		fetchFn,
		pluginId,
		body: eventBrowserLogBody(event),
	}).catch(() => {});
	return true;
}
