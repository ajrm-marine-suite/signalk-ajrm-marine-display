import { browserSpeechAvailable } from "./browser-speech-state.mjs";
import {
	ajrmMarineAuthHeaders,
	assertAisPlusResponseAllowed,
} from "./ajrm-marine-api-access.mjs";
import { SETTINGS_STORAGE_KEYS } from "./settings-storage-keys.mjs";
import {
	encounterSettingsPath,
	encounterSettingsBody,
	getSpeechOutputSettingsPath,
	speechOutputSettingsBody,
} from "./speech-output-ui-state.mjs";
import {
	postEncounterSettings,
	postSpeechOutputSettings,
} from "./speech-output-requests.mjs";

export async function saveSpeechOutputSettings({
	controls,
	pluginId,
	fetchFn = fetch,
	localStorageRef = localStorage,
	windowObject = window,
	postSettings = postSpeechOutputSettings,
	speechAvailable = browserSpeechAvailable,
	onError = (error) => console.error("Error saving speech output settings", error),
}) {
	localStorageRef.setItem(
		SETTINGS_STORAGE_KEYS.browserSpeech,
		controls.browser.checked,
	);
	if (
		(controls.muted.checked || !controls.browser.checked) &&
		speechAvailable(windowObject)
	) {
		windowObject.speechSynthesis.cancel();
	}
	try {
		const response = await postSettings({ fetchFn, pluginId, controls });
		if (response?.ok === false) {
			throw new Error(`Speech output save failed: ${response.status}`);
		}
		if (response?.ok && typeof response.json === "function") {
			return await response.json();
		}
		return true;
	} catch (error) {
		onError(error);
		return false;
	}
}

export async function saveEncounterSettings({
	controls,
	pluginId,
	fetchFn = fetch,
	postSettings = postEncounterSettings,
	onError = (error) => console.error("Error saving encounter settings", error),
}) {
	try {
		await postSettings({ fetchFn, pluginId, controls });
		return true;
	} catch (error) {
		onError(error);
		return false;
	}
}

async function responseJson(response, label) {
	if (!response?.ok) {
		if (response) await assertAisPlusResponseAllowed(response, label);
		throw new Error(`${label} failed: ${response?.status ?? "no response"}`);
	}
	return response.json();
}

function settingsEqual(expected, actual) {
	return Object.entries(expected).every(([key, value]) => actual?.[key] === value);
}

export async function saveSpeechOutputSettingsVerified({
	controls,
	pluginId,
	fetchFn = fetch,
	postSettings = postSpeechOutputSettings,
}) {
	const expected = speechOutputSettingsBody(controls);
	const response = await postSettings({ fetchFn, pluginId, controls });
	await responseJson(response, "Speech output save");
	const saved = await responseJson(
		await fetchFn(getSpeechOutputSettingsPath(pluginId), {
			credentials: "include",
			headers: ajrmMarineAuthHeaders(),
		}),
		"Speech output verification",
	);
	if (!settingsEqual(expected, saved)) {
		throw new Error("Speech output settings did not match the server");
	}
	return saved;
}

export async function saveEncounterSettingsVerified({
	controls,
	pluginId,
	fetchFn = fetch,
	postSettings = postEncounterSettings,
}) {
	const expected = encounterSettingsBody(controls);
	const response = await postSettings({ fetchFn, pluginId, controls });
	await responseJson(response, "Alert settings save");
	const saved = await responseJson(
		await fetchFn(encounterSettingsPath(pluginId), {
			credentials: "include",
			headers: ajrmMarineAuthHeaders(),
		}),
		"Alert settings verification",
	);
	if (!settingsEqual(expected, saved)) {
		throw new Error("Alert settings did not match the server");
	}
	return saved;
}
