import { speakBrowserMessage } from "./browser-speech-state.mjs";

export function speakBrowserSoundCheck({
	message,
	windowObject = globalThis.window,
	Utterance = globalThis.SpeechSynthesisUtterance,
}) {
	const spoken = speakBrowserMessage({
		message,
		windowObject,
		Utterance,
	});
	return spoken;
}

export function speakBrowserAlert({
	event,
	windowObject = globalThis.window,
	Utterance = globalThis.SpeechSynthesisUtterance,
}) {
	const spoken = speakBrowserMessage({
		message: event?.audioMessage || event?.message,
		windowObject,
		Utterance,
	});
	return spoken;
}
