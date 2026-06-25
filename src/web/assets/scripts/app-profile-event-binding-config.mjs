export const PROFILE_EVENT_CONTROL_IDS = {
	profilesPanel: "offcanvasProfiles",
	resetSensitivity: "buttonResetSensitivity",
	saveProfile: "buttonSaveProfile",
	restoreDefaults: "buttonRestoreDefaults",
};

export function profileEventElements(document) {
	return {
		profilesPanel: document.getElementById(
			PROFILE_EVENT_CONTROL_IDS.profilesPanel,
		),
		resetSensitivity: document.getElementById(
			PROFILE_EVENT_CONTROL_IDS.resetSensitivity,
		),
		saveProfile: document.getElementById(PROFILE_EVENT_CONTROL_IDS.saveProfile),
		restoreDefaults: document.getElementById(
			PROFILE_EVENT_CONTROL_IDS.restoreDefaults,
		),
	};
}

export function sizeConfigControls(controls) {
	return [controls.size.smallMax, controls.size.mediumMax, controls.size.unknown];
}

export function sensitivityControls(controls) {
	return [
		controls.sensitivity.cpaRange,
		controls.sensitivity.tcpaRange,
		controls.sensitivity.repeatRange,
	];
}

export function distanceRangeControls(controls) {
	return [controls.profileRanges.warningCpa, controls.profileRanges.alarmCpa];
}

export function tcpaRangeControls(controls) {
	return [controls.profileRanges.warningTcpa, controls.profileRanges.alarmTcpa];
}

export function speedRangeControls(controls) {
	return [controls.profileRanges.warningSog, controls.profileRanges.alarmSog];
}
