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

export function browserSpeechForeground(windowObject = globalThis.window) {
	const documentRef = windowObject?.document;
	if (documentRef?.visibilityState === "hidden") return false;
	return typeof documentRef?.hasFocus !== "function" || documentRef.hasFocus();
}

export function browserSpeechBusy(windowObject = globalThis.window) {
	return Boolean(
		windowObject?.speechSynthesis?.speaking ||
			windowObject?.speechSynthesis?.pending,
	);
}

export function browserSpeechEventExpired(event, now = Date.now) {
	const expiresAt = Date.parse(event?.audioExpiresAt || event?.expiresAt || "");
	return Number.isFinite(expiresAt) && now() >= expiresAt;
}

export function cancelBrowserSpeech(windowObject = globalThis.window) {
	windowObject?.speechSynthesis?.cancel?.();
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
