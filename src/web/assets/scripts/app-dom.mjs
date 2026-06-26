import * as bootstrap from "bootstrap";

export function getRequiredElement(id) {
	const el = document.getElementById(id);
	if (!el) {
		throw new Error(`Missing required element: ${id}`);
	}
	return el;
}

export function createAppDom() {
	const elements = {
		alertPlaceholder: getRequiredElement("alertPlaceholder"),
		selectProfileToEdit: getRequiredElement("selectProfileToEdit"),
		selectActiveProfile: getRequiredElement("selectActiveProfile"),
		selectTableSort: getRequiredElement("selectTableSort"),
		checkFullScreen: getRequiredElement("checkFullScreen"),
		checkDarkMode: getRequiredElement("checkDarkMode"),
		checkNoSleep: getRequiredElement("checkNoSleep"),
		buttonEditProfiles: getRequiredElement("buttonEditProfiles"),
		errorMessage: getRequiredElement("errorMessage"),
		alarmDiv: getRequiredElement("alarmDiv"),
		offcanvasEditProfiles: getRequiredElement("offcanvasEditProfiles"),
		modalClosebyBoats: getRequiredElement("modalClosebyBoats"),
		totalTargetCountUI: getRequiredElement("totalTargetCountUI"),
		filteredTargetCountUI: getRequiredElement("filteredTargetCountUI"),
		alarmTargetCountUI: getRequiredElement("alarmTargetCountUI"),
		configWarningCpaRange: getRequiredElement("configWarningCpaRange"),
		configWarningTcpaRange: getRequiredElement("configWarningTcpaRange"),
		configWarningSogRange: getRequiredElement("configWarningSogRange"),
		configAlarmCpaRange: getRequiredElement("configAlarmCpaRange"),
		configAlarmTcpaRange: getRequiredElement("configAlarmTcpaRange"),
		configAlarmSogRange: getRequiredElement("configAlarmSogRange"),
		cpaSensitivityRange: getRequiredElement("configCpaSensitivityRange"),
		tcpaLookaheadRange: getRequiredElement("configTcpaLookaheadRange"),
		repeatSensitivityRange: getRequiredElement("configRepeatSensitivityRange"),
	};

	const modals = {
		alert: new bootstrap.Modal("#modalAlert"),
		alarm: new bootstrap.Modal("#modalAlarm"),
		closebyBoats: new bootstrap.Modal("#modalClosebyBoats"),
		selectedVesselProperties: new bootstrap.Modal(
			"#modalSelectedVesselProperties",
		),
	};

	const offcanvas = {
		settings: new bootstrap.Offcanvas("#offcanvasSettings"),
		editProfiles: new bootstrap.Offcanvas("#offcanvasEditProfiles"),
		targetList: new bootstrap.Offcanvas("#offcanvasTargetList"),
		profiles: new bootstrap.Offcanvas("#offcanvasProfiles"),
	};

	const speechControls = {
		pi: getRequiredElement("checkPiSpeech"),
		stream: getRequiredElement("checkAudioStream"),
		browser: getRequiredElement("checkBrowserSpeech"),
		muted: getRequiredElement("checkSoundMuted"),
		muteButton: getRequiredElement("buttonSoundMuted"),
		muteStatus: getRequiredElement("soundMuteStatus"),
		automute: getRequiredElement("checkAutomuteStationary"),
		alertPanel: getRequiredElement("checkShowAlertPanel"),
		alertPopupSound: getRequiredElement("checkAlertPopupSound"),
		showAlarmPopup: getRequiredElement("checkShowAlarmPopup"),
		allWellEnabled: getRequiredElement("checkAllWellEnabled"),
		allWellIntervalMinutes: getRequiredElement("inputAllWellIntervalMinutes"),
		allWellMessage: getRequiredElement("inputAllWellMessage"),
		useVesselShapeForCpa: getRequiredElement("checkUseVesselShapeForCpa"),
		displayScaledVesselShapes: getRequiredElement(
			"checkDisplayScaledVesselShapes",
		),
		soundCheck: getRequiredElement("buttonSoundCheck"),
		verifySettingsSave: getRequiredElement("buttonVerifySettingsSave"),
		settingsSaveStatus: getRequiredElement("settingsSaveStatus"),
		settingsCollapseButtons: [
			getRequiredElement("collapseSoundOutputs"),
			getRequiredElement("settingsAlertsCollapse"),
			getRequiredElement("settingsDeviceCollapse"),
			getRequiredElement("settingsCourseGuideCollapse"),
		].map((section) =>
			document.querySelector(`[data-bs-target="#${section.id}"]`),
		),
		settingsCollapseSections: [
			getRequiredElement("collapseSoundOutputs"),
			getRequiredElement("settingsAlertsCollapse"),
			getRequiredElement("settingsDeviceCollapse"),
			getRequiredElement("settingsCourseGuideCollapse"),
		],
	};

	const mapControls = {
		selfIconVariant: getRequiredElement("selectSelfIconVariant"),
		selfIconFillColor: getRequiredElement("colorSelfIconFill"),
		selfTcpaGuideMode: getRequiredElement("selectSelfTcpaGuideMode"),
		selfTcpaGuideLargeColor: getRequiredElement("colorSelfTcpaGuideLarge"),
		selfTcpaGuideMediumColor: getRequiredElement("colorSelfTcpaGuideMedium"),
		selfTcpaGuideSmallColor: getRequiredElement("colorSelfTcpaGuideSmall"),
		replayStatus: getRequiredElement("replayStatus"),
		replayMode: getRequiredElement("replayStatusMode"),
		replayTime: getRequiredElement("replayStatusTime"),
		replayFile: getRequiredElement("replayStatusFile"),
	};

	const autoProfileControls = {
		enabled: getRequiredElement("checkAutoProfile"),
		validation: getRequiredElement("autoProfileValidation"),
		status: getRequiredElement("autoProfileStatusMessage"),
	};

	const sizeControls = {
		category: getRequiredElement("selectVesselSizeToEdit"),
		smallMax: getRequiredElement("configSmallVesselMaxLengthMeters"),
		mediumMax: getRequiredElement("configMediumVesselMaxLengthMeters"),
		unknown: getRequiredElement("selectUnknownVesselSizeCategory"),
	};

	return {
		elements,
		modals,
		offcanvas,
		speechControls,
		mapControls,
		autoProfileControls,
		sizeControls,
	};
}
