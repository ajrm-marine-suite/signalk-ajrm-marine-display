import {
	speechOutputDefaultsFromServer,
	storedNotFalse,
	storedTrue,
} from "./app-initial-settings-state.mjs";
import { SETTINGS_STORAGE_KEYS } from "./settings-storage-keys.mjs";
import {
	encounterSettingsPath,
	getSpeechOutputSettingsPath,
} from "./speech-output-ui-state.mjs";
import {
	readHttpUiStateProjection,
	speechOutputUiStateProjection,
} from "./ui-state-projection-reader.mjs";

export async function loadInitialAppSettings({
	pluginId,
	getHttpResponse,
	speechControls,
	setStationaryMuteThreshold,
}) {
	speechControls.browser.checked = storedTrue(
		localStorage,
		SETTINGS_STORAGE_KEYS.browserSpeech,
	);
	speechControls.alertPanel.checked = storedNotFalse(
		localStorage,
		SETTINGS_STORAGE_KEYS.showAlertPanel,
	);
	speechControls.alertPopupSound.checked = storedNotFalse(
		localStorage,
		SETTINGS_STORAGE_KEYS.alertPopupSound,
	);
	speechControls.showAlarmPopup.checked = storedTrue(
		localStorage,
		SETTINGS_STORAGE_KEYS.showPopupAlerts,
	);
	speechControls.pi.checked = true;
	speechControls.stream.checked = true;
	speechControls.muted.checked = false;
	speechControls.automute.checked = false;

	try {
		const speechOutputSettings = await readInitialSpeechOutputSettings({
			pluginId,
			getHttpResponse,
		});
		const settings = speechOutputDefaultsFromServer(speechOutputSettings);
		speechControls.pi.checked = settings.pi;
		speechControls.stream.checked = settings.stream;
		speechControls.muted.checked = settings.muted;
		speechControls.automute.checked = settings.automute;
		setStationaryMuteThreshold(settings.automuteStationarySpeed);
	} catch (_err) {
		// Speech output settings are optional; keep defaults if unavailable.
	}

	speechControls.allWellEnabled.checked = true;
	speechControls.allWellIntervalMinutes.value = "15";
	speechControls.allWellMessage.value = "All's well.";
	speechControls.useVesselShapeForCpa.checked = true;
	speechControls.displayScaledVesselShapes.checked = true;
	setEncounterSettingsSnapshot({});
	try {
		const encounterSettings = await getHttpResponse(
			encounterSettingsPath(pluginId),
			{ ignoreEmptyResponse: true },
		);
		setEncounterSettingsSnapshot(encounterSettings);
		speechControls.allWellEnabled.checked =
			encounterSettings?.allWellEnabled !== false;
		const intervalSeconds = Number(encounterSettings?.allWellIntervalSeconds);
		speechControls.allWellIntervalMinutes.value = Number.isFinite(intervalSeconds)
			? String(Math.max(1, Math.round(intervalSeconds / 60)))
			: "15";
		speechControls.allWellMessage.value =
			typeof encounterSettings?.allWellMessage === "string" &&
			encounterSettings.allWellMessage.trim()
				? encounterSettings.allWellMessage
				: "All's well.";
		speechControls.useVesselShapeForCpa.checked =
			encounterSettings?.useVesselShapeForCpa !== false;
		speechControls.displayScaledVesselShapes.checked =
			encounterSettings?.displayScaledVesselShapes !== false;
	} catch (_err) {
		// Encounter settings are optional; keep defaults if unavailable.
	}
}

async function readInitialSpeechOutputSettings({ pluginId, getHttpResponse }) {
	const speechOutput = await readHttpUiStateProjection({
		pluginId,
		getHttpResponse,
		projection: speechOutputUiStateProjection,
	});
	if (speechOutput) return speechOutput;
	return getHttpResponse(getSpeechOutputSettingsPath(pluginId), {
		ignoreEmptyResponse: true,
	});
}

function setEncounterSettingsSnapshot(encounterSettings) {
	if (!globalThis.window) return;
	globalThis.window.aisPlusEncounterSettings = encounterSettings || {};
}
