import { ajrmMarineAuthHeaders } from "./ajrm-marine-api-access.mjs";

export const SOUND_CHECK_MESSAGE = "Sound Check. Testing 1, 2, 3.";

export { uiStatePath } from "./ui-state-routes.mjs";

export function getSpeechOutputSettingsPath(_pluginId) {
	return `/plugins/signalk-ajrm-marine-traffic/commands/audio`;
}

export function encounterSettingsPath(_pluginId) {
	return `/signalk/v1/api/ajrmMarineDisplay/encounterSettings`;
}

export function speechOutputSettingsPath(_pluginId) {
	return `/plugins/signalk-ajrm-marine-traffic/commands/audio`;
}

export function soundCheckPath(_pluginId) {
	return `/signalk/v1/api/ajrmMarineDisplay/soundCheck`;
}

export function soundStateAnnouncementPath(_pluginId) {
	return `/plugins/signalk-ajrm-marine-traffic/commands/audio`;
}

export function announcementLogPath(_pluginId) {
	return `/signalk/v1/api/ajrmMarineDisplay/announcementLog`;
}

export function clearAnnouncementLogPath(_pluginId) {
	return `/signalk/v1/api/ajrmMarineDisplay/announcementLog/clear`;
}

export function browserSpeechEventsPath(_pluginId) {
	return `/signalk/v1/api/ajrmMarineDisplay/browserSpeechEvents`;
}

export function soundCheckAlertState({ sent, failed }) {
	if (failed) return { message: "Sound check failed", type: "danger" };
	if (sent) return { message: "Sound check sent", type: "success" };
	return { message: "No speech outputs selected", type: "warning" };
}

export function jsonRequestOptions({ method, body }) {
	return {
		credentials: "include",
		method,
		headers: ajrmMarineAuthHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify(body),
	};
}

export function speechOutputSettingsRequestOptions(controls) {
	return jsonRequestOptions({
		method: "POST",
		body: speechOutputSettingsBody(controls),
	});
}

export function encounterSettingsRequestOptions(controls) {
	return jsonRequestOptions({
		method: "POST",
		body: encounterSettingsBody(controls),
	});
}

export function announcementLogRequestOptions(body) {
	return jsonRequestOptions({
		method: "POST",
		body,
	});
}

export function soundCheckRequestOptions(message) {
	return jsonRequestOptions({
		method: "POST",
		body: soundCheckRequestBody(message),
	});
}

export function soundStateAnnouncementRequestOptions({ muted }) {
	return jsonRequestOptions({
		method: "POST",
		body: soundStateAnnouncementRequestBody({ muted }),
	});
}

export function speechOutputSettingsBody(controls) {
	return {
		piSpeech: controls.pi.checked,
		audioStream: controls.stream.checked,
		muted: controls.muted.checked,
		automuteStationary: controls.automute.checked,
	};
}

export function encounterSettingsBody(controls) {
	return {
		allWellEnabled: controls.allWellEnabled.checked,
		allWellIntervalSeconds: Math.max(
			60,
			Math.round(Number(controls.allWellIntervalMinutes.value || 15) * 60),
		),
		allWellMessage: String(controls.allWellMessage.value || "").trim(),
		useVesselShapeForCpa: controls.useVesselShapeForCpa?.checked !== false,
		displayScaledVesselShapes:
			controls.displayScaledVesselShapes?.checked !== false,
	};
}

export function soundCheckRequestBody(message) {
	return { message };
}

export function soundStateAnnouncementMessage({ muted } = {}) {
	return muted ? "Sounds disabled." : "Sounds enabled.";
}

export function soundStateAnnouncementRequestBody({ muted } = {}) {
	return { muted: muted === true };
}
