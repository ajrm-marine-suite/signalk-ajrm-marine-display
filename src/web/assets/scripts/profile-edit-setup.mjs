import { createProfileEditController } from "./profile-edit-controller.mjs";

function getRequiredElement(id) {
	const el = document.getElementById(id);
	if (!el) {
		throw new Error(`Missing required element: ${id}`);
	}
	return el;
}

export function createConfiguredProfileEditController({
	elements,
	sizeControls,
	profileService,
	profileActions,
	pluginId,
	getProfiles,
	setProfiles,
	targets,
	updateSingleVesselUI,
	showAlert,
	refresh,
}) {
	return createProfileEditController({
		controls: {
			selectProfileToEdit: elements.selectProfileToEdit,
			selectActiveProfile: elements.selectActiveProfile,
			warningCpaRange: elements.configWarningCpaRange,
			warningTcpaRange: elements.configWarningTcpaRange,
			warningSogRange: elements.configWarningSogRange,
			alarmCpaRange: elements.configAlarmCpaRange,
			alarmTcpaRange: elements.configAlarmTcpaRange,
			alarmSogRange: elements.configAlarmSogRange,
			guardRangeRange: elements.configGuardRangeRange,
			guardSogRange: elements.configGuardSogRange,
		},
		sizeControls,
		sensitivityControls: {
			cpaRange: elements.cpaSensitivityRange,
			tcpaRange: elements.tcpaLookaheadRange,
			repeatRange: elements.repeatSensitivityRange,
			cpaValue: getRequiredElement("configCpaSensitivity"),
			tcpaValue: getRequiredElement("configTcpaLookahead"),
			repeatValue: getRequiredElement("configRepeatSensitivity"),
		},
		pluginId,
		getProfiles,
		setProfiles,
		normalizeCollisionProfiles: profileService.normalizeCollisionProfiles,
		normalizeVesselSizeConfig: profileService.normalizeVesselSizeConfig,
		saveProfiles: profileActions.saveCollisionProfiles,
		targets,
		updateSingleVesselUI,
		showAlert,
		refresh,
	});
}
