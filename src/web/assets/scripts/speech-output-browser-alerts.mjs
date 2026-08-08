/**
 * Implements the speech output browser alerts responsibilities of the AJRM Marine Display browser application.
 */

import { speakBrowserAlert } from "./browser-speech-actions.mjs";
import {
	browserSpeechBusy,
	browserSpeechEventExpired,
	browserSpeechForeground,
	cancelBrowserSpeech,
	shouldSpeakBrowserAlert,
	shouldSpeakBrowserSpeechEvent,
	shouldUseBrowserSpeech,
	speakBrowserMessage,
} from "./browser-speech-state.mjs";
import {
	browserSpeechEventsPath,
} from "./speech-output-ui-state.mjs";
import {
	browserSpeechEventsUiStateProjection,
	readFetchUiStateProjection,
} from "./ui-state-projection-reader.mjs";

function browserSpeechEventsFromUiState(uiState) {
	return browserSpeechEventsUiStateProjection(uiState);
}

async function readRouteBrowserSpeechEvents({ fetchFn, pluginId }) {
	const response = await fetchFn(browserSpeechEventsPath(pluginId), {
		credentials: "include",
		cache: "no-store",
	});
	if (!response?.ok) return [];
	const data = await response.json();
	return Array.isArray(data.events) ? data.events : [];
}

async function readBrowserSpeechEvents({
	fetchFn,
	pluginId,
	uiState,
	allowFetchFallback = true,
}) {
	const suppliedUiStateEvents = browserSpeechEventsFromUiState(uiState);
	if (suppliedUiStateEvents) return suppliedUiStateEvents;
	if (!allowFetchFallback) return [];
	const uiStateEvents = await readFetchUiStateProjection({
		fetchFn,
		pluginId,
		projection: browserSpeechEventsUiStateProjection,
	});
	if (uiStateEvents) return uiStateEvents;
	return readRouteBrowserSpeechEvents({ fetchFn, pluginId });
}

export async function speakBrowserAlertsForOutput({
	events,
	controls,
	browserSpokenAlerts,
	pluginId,
	fetchFn,
	uiState,
	allowFetchFallback = true,
	windowObject,
	Utterance,
	now = Date.now,
}) {
	if (
		!shouldUseBrowserSpeech({
			muted: controls.muted.checked,
			browserChecked: controls.browser.checked,
			windowObject,
		})
	) {
		return;
	}
	if (!browserSpeechForeground(windowObject)) {
		cancelBrowserSpeech(windowObject);
		for (const event of events) {
			if (!shouldSpeakBrowserAlert({ event, spokenAlerts: browserSpokenAlerts })) {
				continue;
			}
			browserSpokenAlerts.set(event.id, {
				message: event.message,
				state: event.state,
				ts: now(),
				disposition: "discarded-background",
			});
		}
		return;
	}
	for (const event of events) {
		if (!shouldSpeakBrowserAlert({ event, spokenAlerts: browserSpokenAlerts })) {
			continue;
		}
		if (browserSpeechEventExpired(event, now)) {
			browserSpokenAlerts.set(event.id, {
				message: event.message,
				state: event.state,
				ts: now(),
				disposition: "discarded-expired",
			});
			continue;
		}
		if (browserSpeechBusy(windowObject)) break;
		const spoken = speakBrowserAlert({
			event,
			windowObject,
			Utterance,
		});
		if (!spoken) continue;
		browserSpokenAlerts.set(event.id, {
			message: event.message,
			state: event.state,
			ts: now(),
			disposition: "queued",
		});
		break;
	}
	if (events.length > 0) return;
	let speechEvents = [];
	try {
		speechEvents = await readBrowserSpeechEvents({
			fetchFn,
			pluginId,
			uiState,
			allowFetchFallback,
		});
	} catch {
		return;
	}
	for (const event of speechEvents) {
		const currentTime = now();
		if (
			!shouldSpeakBrowserSpeechEvent({
				event,
				spokenAlerts: browserSpokenAlerts,
			})
		) {
			continue;
		}
		if (browserSpeechEventExpired(event, now)) {
			browserSpokenAlerts.set(event.id, {
				message: event.message,
				state: event.state,
				ts: currentTime,
				disposition: "discarded-expired",
			});
			continue;
		}
		if (browserSpeechBusy(windowObject)) break;
		const spoken = speakBrowserMessage({
			message: event.message,
			windowObject,
			Utterance,
		});
		if (!spoken) continue;
		browserSpokenAlerts.set(event.id, {
			message: event.message,
			state: event.state,
			ts: currentTime,
		});
		break;
	}
}
