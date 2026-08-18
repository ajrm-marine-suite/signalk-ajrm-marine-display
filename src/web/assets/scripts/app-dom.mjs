/**
 * Implements the app DOM responsibilities of the AJRM Marine Display browser application.
 */

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
		anchorControls: {
			drop: getRequiredElement("buttonDropAnchor"),
			clear: getRequiredElement("buttonClearAnchor"),
			status: getRequiredElement("anchorActionStatus"),
		},
		errorMessage: getRequiredElement("errorMessage"),
		alarmDiv: getRequiredElement("alarmDiv"),
		offcanvasEditProfiles: getRequiredElement("offcanvasEditProfiles"),
		modalClosebyBoats: getRequiredElement("modalClosebyBoats"),
		gpsStatusIndicator: getRequiredElement("gpsStatusIndicator"),
		gpsStatusText: getRequiredElement("gpsStatusText"),
		cursorPosition: getRequiredElement("cursorPosition"),
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
		tides: new bootstrap.Modal("#modalTides"),
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
		audioModeAuto: getRequiredElement("radioAudioModeAuto"),
		audioModeOn: getRequiredElement("radioAudioModeOn"),
		audioModeOff: getRequiredElement("radioAudioModeOff"),
		audioModeStatus: getRequiredElement("displayAudioModeStatus"),
		alertPanel: getRequiredElement("checkShowAlertPanel"),
		alertPopupSound: getRequiredElement("checkAlertPopupSound"),
		showAlarmPopup: getRequiredElement("checkShowAlarmPopup"),
		allWellEnabled: getRequiredElement("checkAllWellEnabled"),
		allWellIntervalMinutes: getRequiredElement("inputAllWellIntervalMinutes"),
		allWellMessage: getRequiredElement("inputAllWellMessage"),
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
			getRequiredElement("settingsRouteCollapse"),
		].map((section) =>
			document.querySelector(`[data-bs-target="#${section.id}"]`),
		),
		settingsCollapseSections: [
			getRequiredElement("collapseSoundOutputs"),
			getRequiredElement("settingsAlertsCollapse"),
			getRequiredElement("settingsDeviceCollapse"),
			getRequiredElement("settingsCourseGuideCollapse"),
			getRequiredElement("settingsRouteCollapse"),
		],
	};

	const mapControls = {
		chartCycleButton: getRequiredElement("buttonCycleChart"),
		chartCycleShortcut: getRequiredElement("inputChartCycleShortcut"),
		chartCycleStatus: getRequiredElement("chartCycleStatus"),
		cursorPosition: getRequiredElement("checkCursorPosition"),
		coordinateFormat: getRequiredElement("selectCoordinateFormat"),
		selfIconVariant: getRequiredElement("selectSelfIconVariant"),
		selfIconOrientation: getRequiredElement("selectSelfIconOrientation"),
		selfIconFillColor: getRequiredElement("colorSelfIconFill"),
		selfIconScalePercent: getRequiredElement("rangeSelfIconScale"),
		selfIconScaleValue: getRequiredElement("selfIconScaleValue"),
		mapFollowLookAheadPercent: getRequiredElement("rangeMapFollowLookAhead"),
		mapFollowLookAheadValue: getRequiredElement("mapFollowLookAheadValue"),
		selfTcpaGuideMode: getRequiredElement("selectSelfTcpaGuideMode"),
		selfTcpaGuideLargeColor: getRequiredElement("colorSelfTcpaGuideLarge"),
		selfTcpaGuideMediumColor: getRequiredElement("colorSelfTcpaGuideMedium"),
		selfTcpaGuideSmallColor: getRequiredElement("colorSelfTcpaGuideSmall"),
		routeLineColor: getRequiredElement("colorRouteLine"),
		routeLineWidth: getRequiredElement("rangeRouteLineWidth"),
		routeLineWidthValue: getRequiredElement("routeLineWidthValue"),
		replayStatus: getRequiredElement("replayStatus"),
		replayMode: getRequiredElement("replayStatusMode"),
		replayTime: getRequiredElement("replayStatusTime"),
		replayFile: getRequiredElement("replayStatusFile"),
	};

	const routeControls = {
		modal: getRequiredElement("modalRoutes"),
		piFile: getRequiredElement("selectPiRouteFile"),
		piDirectory: getRequiredElement("routePiDirectory"),
		onlyCurrentChartArea: getRequiredElement("checkRoutesInCurrentChartArea"),
		viewportFilterHelp: getRequiredElement("routeViewportFilterHelp"),
		openPi: getRequiredElement("buttonOpenPiRoute"),
		resource: getRequiredElement("selectSignalKRoute"),
		openResource: getRequiredElement("buttonOpenSignalKRoute"),
		deleteResource: getRequiredElement("buttonDeleteSignalKRoute"),
		browserFiles: getRequiredElement("inputBrowserRouteFiles"),
		browserDirectory: getRequiredElement("inputBrowserRouteDirectory"),
		browserRoute: getRequiredElement("selectBrowserRoute"),
		browserFileHelp: getRequiredElement("routeBrowserFileHelp"),
		saveImportedToPi: getRequiredElement("checkSaveImportedRouteToPi"),
		openBrowser: getRequiredElement("buttonOpenBrowserRoute"),
		title: getRequiredElement("activeRouteTitle"),
		details: getRequiredElement("activeRouteDetails"),
		reverse: getRequiredElement("checkReverseRoute"),
		name: getRequiredElement("inputRouteName"),
		fileName: getRequiredElement("inputRouteFileName"),
		save: getRequiredElement("buttonSaveRoute"),
		saveAs: getRequiredElement("buttonSaveRouteAs"),
		download: getRequiredElement("buttonDownloadRoute"),
		close: getRequiredElement("buttonCloseRoute"),
		status: getRequiredElement("routeStatus"),
	};

	const locationTideControls = {
		dialog: getRequiredElement("tideModalDialog"),
		resizeHandle: getRequiredElement("tideModalResizeHandle"),
		open: getRequiredElement("buttonOpenTides"),
		statusPanel: getRequiredElement("tideStatusPanel"),
		unavailable: getRequiredElement("tideUnavailable"),
		heightNow: getRequiredElement("tideHeightNow"),
		trend: getRequiredElement("tideTrend"),
		nextHigh: getRequiredElement("tideNextHigh"),
		nextLow: getRequiredElement("tideNextLow"),
		distanceToFall: getRequiredElement("tideDistanceToFall"),
		datum: getRequiredElement("tideDatum"),
		station: getRequiredElement("tideStation"),
		selectionReason: getRequiredElement("tideSelectionReason"),
		sourceFreshness: getRequiredElement("tideSourceFreshness"),
		springNeapStatus: getRequiredElement("tideSpringNeapStatus"),
		springNeapTiming: getRequiredElement("tideSpringNeapTiming"),
		curve: getRequiredElement("tideCurve"),
		graphDays: getRequiredElement("selectTideGraphDays"),
		alternativePort: getRequiredElement("selectAlternativeTidePort"),
		pin: getRequiredElement("buttonPinTidePort"),
		clearPin: getRequiredElement("buttonClearTidePortPin"),
		refresh: getRequiredElement("buttonRefreshTides"),
		actionStatus: getRequiredElement("tideActionStatus"),
		showAnchorages: getRequiredElement("checkShowAnchorages"),
		showLocations: getRequiredElement("checkShowLocations"),
		showStatus: getRequiredElement("checkShowTideStatus"),
		anchoringSuggestion: getRequiredElement("anchoringSuggestion"),
		anchoringSuggestionText: getRequiredElement("anchoringSuggestionText"),
		confirmAnchoring: getRequiredElement("buttonConfirmAnchoring"),
		dismissAnchoring: getRequiredElement("buttonDismissAnchoring"),
	};

	const observationControls = {
		modal: getRequiredElement("modalVoyageObservation"),
		form: getRequiredElement("formVoyageObservation"),
		text: getRequiredElement("textVoyageObservation"),
		includeSnapshot: getRequiredElement("checkObservationSnapshot"),
		snapshotHelp: getRequiredElement("observationSnapshotHelp"),
		status: getRequiredElement("observationStatus"),
		save: getRequiredElement("buttonSaveObservation"),
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
		routeControls,
		observationControls,
		locationTideControls,
		autoProfileControls,
		sizeControls,
	};
}
