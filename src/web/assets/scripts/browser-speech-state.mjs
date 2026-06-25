export function browserSpeechAvailable(windowObject = globalThis.window) {
	return Boolean(windowObject && "speechSynthesis" in windowObject);
}

export function shouldUseBrowserSpeech({
	muted,
	browserChecked,
	windowObject = globalThis.window,
}) {
	return !muted && Boolean(browserChecked) && browserSpeechAvailable(windowObject);
}

export function shouldSpeakBrowserAlert({ event, spokenAlerts }) {
	return Boolean(event?.shouldAnnounce && event.message && !spokenAlerts.has(event.id));
}

export function shouldSpeakBrowserSpeechEvent({ event, spokenAlerts }) {
	return Boolean(event?.id && event.message && !spokenAlerts.has(event.id));
}

export function soundCheckBrowserLogBody(message) {
	return {
		output: "browser",
		vesselName: "AJRM Marine",
		severity: "alert",
		category: "test",
		message,
		reason: "sound-check",
	};
}

export function eventBrowserLogBody(event) {
	return {
		output: "browser",
		vesselName: event.displayName,
		mmsi: event.mmsi,
		severity: event.state,
		category: event.category || "cpa",
		message: event.message,
		reason: event.reason || "browser-speech",
		announcementId: event.id,
		ts: event.ts,
	};
}

export function speakBrowserMessage({
	message,
	windowObject = globalThis.window,
	Utterance = globalThis.SpeechSynthesisUtterance,
	rate = 0.95,
	cancelFirst = false,
}) {
	if (!message || !browserSpeechAvailable(windowObject) || !Utterance) {
		return false;
	}
	if (cancelFirst) windowObject.speechSynthesis.cancel();
	const utterance = new Utterance(message);
	utterance.rate = rate;
	windowObject.speechSynthesis.speak(utterance);
	return true;
}
