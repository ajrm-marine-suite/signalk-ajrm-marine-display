import { speakBrowserAlertsForOutput } from "./speech-output-browser-alerts.mjs";
import {
	ajrmMarineAuthHeaders,
	assertAisPlusResponseAllowed,
} from "./ajrm-marine-api-access.mjs";
import { announceSoundState } from "./speech-output-sound-state.mjs";
import { runSoundCheck } from "./speech-output-sound-check.mjs";
import { speechOutputDefaultsFromServer } from "./app-initial-settings-state.mjs";
import {
	saveEncounterSettings,
	saveSpeechOutputSettings,
} from "./speech-output-save-settings.mjs";
import { createSpeechOutputMuteController } from "./speech-output-mute-controller.mjs";
import { getSpeechOutputSettingsPath } from "./speech-output-ui-state.mjs";
import { speechOutputUiStateProjection } from "./ui-state-projection-reader.mjs";
import { SETTINGS_STORAGE_KEYS } from "./settings-storage-keys.mjs";

export function createSpeechOutputController({
	controls,
	pluginId,
	showAlert,
}) {
	const browserSpokenAlerts = new Map();
	let alertSettingsSavePromise = null;
	let alertSettingsSaveRequested = false;
	let serverSpeechOutputSettings = null;
	let speechSettingsSavePromise = null;
	let speechSettingsRefreshPromise = null;
	let muteController;

	function applyServerSpeechOutputSettings(settings) {
		if (!settings || typeof settings !== "object") return false;
		serverSpeechOutputSettings = settings;
		const serverSettings = speechOutputDefaultsFromServer(settings);
		controls.pi.checked = serverSettings.pi;
		controls.stream.checked = serverSettings.stream;
		controls.muted.checked = serverSettings.muted;
		controls.automute.checked = serverSettings.automute;
		muteController?.updateMuteStatus();
		return true;
	}

	async function saveSettings() {
		speechSettingsSavePromise = (async () => {
			const saved = await saveSpeechOutputSettings({ controls, pluginId });
			applyServerSpeechOutputSettings(saved);
			return saved;
		})();
		try {
			return await speechSettingsSavePromise;
		} finally {
			speechSettingsSavePromise = null;
		}
	}

	async function refreshSettingsFromServer() {
		if (speechSettingsSavePromise) return false;
		if (speechSettingsRefreshPromise) return speechSettingsRefreshPromise;
		speechSettingsRefreshPromise = (async () => {
			try {
				const response = await fetch(getSpeechOutputSettingsPath(pluginId), {
					credentials: "include",
					cache: "no-store",
					headers: ajrmMarineAuthHeaders(),
				});
				if (!response?.ok) {
					if (response) {
						await assertAisPlusResponseAllowed(
							response,
							"AJRM Marine speech settings",
						);
					}
					return false;
				}
				return applyServerSpeechOutputSettings(await response.json());
			} catch (error) {
				console.error("Error refreshing speech output settings", error);
				return false;
			}
		})();
		try {
			return await speechSettingsRefreshPromise;
		} finally {
			speechSettingsRefreshPromise = null;
		}
	}

	function refreshSettingsFromUiState(uiState) {
		if (speechSettingsSavePromise) return false;
		return applyServerSpeechOutputSettings(
			speechOutputUiStateProjection(uiState),
		);
	}

	async function announceSoundStateChange({ muted } = {}) {
		await announceSoundState({
			controls,
			pluginId,
			fetchFn: fetch,
			muted,
			windowObject: window,
			Utterance:
				window.SpeechSynthesisUtterance ?? globalThis.SpeechSynthesisUtterance,
		});
	}

	async function saveAlertsSettings() {
		alertSettingsSaveRequested = true;
		if (!alertSettingsSavePromise) {
			alertSettingsSavePromise = (async () => {
				try {
					while (alertSettingsSaveRequested) {
						alertSettingsSaveRequested = false;
						const saved = await saveEncounterSettings({ controls, pluginId });
						if (!saved) {
							showAlert?.("Error saving alert settings", "danger");
							return false;
						}
					}
					return true;
				} finally {
					alertSettingsSavePromise = null;
				}
			})();
		}
		return alertSettingsSavePromise;
	}

	function setSaveStatus(message, className = "text-body-secondary") {
		if (!controls.settingsSaveStatus) return;
		controls.settingsSaveStatus.textContent = message;
		controls.settingsSaveStatus.className = `form-text text-center ${className}`;
	}

	function closeSettingsSubmenus() {
		for (const section of controls.settingsCollapseSections || []) {
			section?.classList?.remove("show");
		}
		for (const button of controls.settingsCollapseButtons || []) {
			button?.classList?.add("collapsed");
			button?.setAttribute?.("aria-expanded", "false");
		}
	}

	async function saveVerifiedSettings() {
		if (controls.verifySettingsSave) {
			controls.verifySettingsSave.disabled = true;
		}
		setSaveStatus("Saving settings...");
		try {
			verifyDisplayAlertSettings({ controls, storage: localStorage });
			setSaveStatus("Display settings saved and verified.", "text-success");
			closeSettingsSubmenus();
			showAlert?.("Display settings saved and verified", "success");
			return true;
		} catch (error) {
			setSaveStatus("Settings save could not be verified.", "text-danger");
			showAlert?.("Settings save could not be verified", "danger");
			console.error("Error saving verified settings", error);
			return false;
		} finally {
			if (controls.verifySettingsSave) {
				controls.verifySettingsSave.disabled = false;
			}
		}
	}

	muteController = createSpeechOutputMuteController({
		controls,
		announceSoundState: announceSoundStateChange,
		getServerSpeechOutputSettings: () => serverSpeechOutputSettings,
		saveSettings,
	});

	async function soundCheck() {
		await runSoundCheck({
			controls,
			pluginId,
			fetchFn: fetch,
			showAlert,
			windowObject: window,
			Utterance:
				window.SpeechSynthesisUtterance ?? globalThis.SpeechSynthesisUtterance,
		});
	}

	async function speakBrowserAlerts(
		events,
		{ uiState, allowFetchFallback = true } = {},
	) {
		await speakBrowserAlertsForOutput({
			events,
			controls,
			browserSpokenAlerts,
			pluginId,
			fetchFn: fetch,
			uiState,
			allowFetchFallback,
			windowObject: window,
			Utterance:
				window.SpeechSynthesisUtterance ?? globalThis.SpeechSynthesisUtterance,
		});
	}

	return {
		saveAlertsSettings,
		saveVerifiedSettings,
		saveSettings,
		soundCheck,
		speakBrowserAlerts,
		refreshSettingsFromUiState,
		refreshSettingsFromServer,
		...muteController,
	};
}

export function verifyDisplayAlertSettings({ controls, storage = localStorage }) {
	const expected = [
		[SETTINGS_STORAGE_KEYS.showAlertPanel, controls.alertPanel.checked],
		[SETTINGS_STORAGE_KEYS.showPopupAlerts, controls.showAlarmPopup.checked],
		[SETTINGS_STORAGE_KEYS.alertPopupSound, controls.alertPopupSound.checked],
	];
	for (const [key, value] of expected) {
		storage.setItem(key, String(value));
		if (storage.getItem(key) !== String(value)) {
			throw new Error(`Display setting ${key} did not verify`);
		}
	}
	return true;
}
