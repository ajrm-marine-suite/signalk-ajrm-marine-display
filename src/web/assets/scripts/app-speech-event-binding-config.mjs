import { SETTINGS_STORAGE_KEYS } from "./settings-storage-keys.mjs";

export function speechSaveSettingControls(controls) {
	return [controls.pi, controls.stream, controls.browser];
}

export function speechManualMuteControl(controls) {
	return controls.muted;
}

export function speechAutomuteControl(controls) {
	return controls.automute;
}

export function speechSoundCheckControl(controls) {
	return controls.soundCheck;
}

export function speechVerifiedSaveControl(controls) {
	return controls.verifySettingsSave;
}

export function speechEncounterSettingControls(controls) {
	return [
		controls.allWellEnabled,
		controls.allWellIntervalMinutes,
		controls.allWellMessage,
	];
}

export function speechEncounterInputSettingControls(controls) {
	return [controls.allWellIntervalMinutes, controls.allWellMessage];
}

export function speechStorageBindings({ controls, storage }) {
	return [
		{
			control: controls.alertPanel,
			key: SETTINGS_STORAGE_KEYS.showAlertPanel,
			storage,
		},
		{
			control: controls.alertPopupSound,
			key: SETTINGS_STORAGE_KEYS.alertPopupSound,
			storage,
		},
		{
			control: controls.showAlarmPopup,
			key: SETTINGS_STORAGE_KEYS.showPopupAlerts,
			storage,
		},
	];
}
