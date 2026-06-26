import {
	speechAutomuteControl,
	speechAudioModeControls,
	speechEncounterInputSettingControls,
	speechEncounterSettingControls,
	speechManualMuteControl,
	speechSaveSettingControls,
	speechSoundCheckControl,
	speechStorageBindings,
	speechVerifiedSaveControl,
} from "./app-speech-event-binding-config.mjs";
import { bindCheckboxStorage } from "./checkbox-storage-binding.mjs";

export function registerSpeechEventBindings({
	controls,
	speechOutput,
	storage = localStorage,
}) {
	for (const control of speechSaveSettingControls(controls)) {
		control.addEventListener("change", speechOutput.saveSettings);
	}
	speechManualMuteControl(controls).addEventListener(
		"change",
		speechOutput.handleManualMuteChange,
	);
	speechAutomuteControl(controls).addEventListener("change", () => {
		speechOutput.handleAutomuteChange();
	});
	for (const control of speechAudioModeControls(controls)) {
		control.addEventListener("change", () => {
			if (control.checked) speechOutput.handleAudioModeChange(control.value);
		});
	}
	for (const binding of speechStorageBindings({ controls, storage })) {
		bindCheckboxStorage(binding);
	}
	for (const control of speechEncounterSettingControls(controls)) {
		control.addEventListener("change", speechOutput.saveAlertsSettings);
	}
	for (const control of speechEncounterInputSettingControls(controls)) {
		control.addEventListener("input", speechOutput.saveAlertsSettings);
	}
	speechSoundCheckControl(controls).addEventListener(
		"click",
		speechOutput.soundCheck,
	);
	speechVerifiedSaveControl(controls).addEventListener(
		"click",
		speechOutput.saveVerifiedSettings,
	);
}
