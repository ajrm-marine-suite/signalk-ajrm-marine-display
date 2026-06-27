import { assertAisPlusResponseAllowed } from "./ajrm-marine-api-access.mjs";
import {
	announcementLogPath,
	announcementLogRequestOptions,
	encounterSettingsPath,
	encounterSettingsRequestOptions,
	soundCheckPath,
	soundCheckRequestOptions,
	soundStateAnnouncementPath,
	soundStateAnnouncementRequestOptions,
	speechOutputSettingsPath,
	speechOutputSettingsRequestOptions,
} from "./speech-output-ui-state.mjs";

async function ajrmMarineRequest({ fetchFn, path, options, label }) {
	const response = await fetchFn(path, options);
	await assertAisPlusResponseAllowed(response, label);
	return response;
}

export function postSpeechOutputSettings({ fetchFn, pluginId, controls }) {
	return ajrmMarineRequest({
		fetchFn,
		path: speechOutputSettingsPath(pluginId),
		options: speechOutputSettingsRequestOptions(controls),
		label: "AJRM Marine speech controls",
	});
}

export function postAnnouncementLog({ fetchFn, pluginId, body }) {
	return ajrmMarineRequest({
		fetchFn,
		path: announcementLogPath(pluginId),
		options: announcementLogRequestOptions(body),
		label: "AJRM Marine announcements",
	});
}

export function postEncounterSettings({ fetchFn, pluginId, controls }) {
	return ajrmMarineRequest({
		fetchFn,
		path: encounterSettingsPath(pluginId),
		options: encounterSettingsRequestOptions(controls),
		label: "AJRM Marine alert settings",
	});
}

export async function sendPiSoundCheck({ fetchFn, pluginId, message }) {
	const response = await ajrmMarineRequest({
		fetchFn,
		path: soundCheckPath(pluginId),
		options: soundCheckRequestOptions(message),
		label: "AJRM Marine sound check",
	});
	if (!response.ok) {
		throw new Error(`Sound check failed: ${response.status}`);
	}
	return response;
}

export async function sendSoundStateAnnouncement({ fetchFn, pluginId, muted }) {
	const response = await ajrmMarineRequest({
		fetchFn,
		path: soundStateAnnouncementPath(pluginId),
		options: soundStateAnnouncementRequestOptions({ muted }),
		label: "AJRM Marine sound controls",
	});
	if (!response.ok) {
		throw new Error(`Sound state announcement failed: ${response.status}`);
	}
	return response;
}
