export function registerConfiguredAppEventBindings({
	registerAppEventBindings,
	map,
	document,
	elements,
	sizeControls,
	speechControls,
	mapControls,
	autoProfileControls,
	offcanvas,
	controllers,
	state,
	actions,
}) {
	registerAppEventBindings({
		map,
		document,
		controls: appEventBindingControls({
			elements,
			sizeControls,
			speechControls,
			mapControls,
			autoProfileControls,
		}),
		controllers: appEventBindingControllers({ controllers, offcanvas }),
		state,
		actions,
	});
}

export function appEventBindingControls({
	elements,
	sizeControls,
	speechControls,
	mapControls,
	autoProfileControls,
}) {
	return {
		selectActiveProfile: elements.selectActiveProfile,
		selectProfileToEdit: elements.selectProfileToEdit,
		selectTableSort: elements.selectTableSort,
		buttonEditProfiles: elements.buttonEditProfiles,
		offcanvasEditProfiles: elements.offcanvasEditProfiles,
		size: sizeControls,
		sensitivity: {
			cpaRange: elements.cpaSensitivityRange,
			tcpaRange: elements.tcpaLookaheadRange,
			repeatRange: elements.repeatSensitivityRange,
		},
		speech: speechControls,
		map: mapControls,
		autoProfile: autoProfileControls,
		profileRanges: {
			warningCpa: elements.configWarningCpaRange,
			warningTcpa: elements.configWarningTcpaRange,
			warningSog: elements.configWarningSogRange,
			alarmCpa: elements.configAlarmCpaRange,
			alarmTcpa: elements.configAlarmTcpaRange,
			alarmSog: elements.configAlarmSogRange,
			guardRange: elements.configGuardRangeRange,
			guardSog: elements.configGuardSogRange,
		},
	};
}

export function appEventBindingControllers({ controllers, offcanvas }) {
	return {
		autoCharts: controllers.autoCharts,
		autoProfileSettings: controllers.autoProfileSettings,
		gpsLossPopup: controllers.gpsLossPopup,
		labelCollision: controllers.labelCollision,
		offcanvasEditProfiles: offcanvas.editProfiles,
		offcanvasProfiles: offcanvas.profiles,
		offcanvasSettings: offcanvas.settings,
		profileEdit: controllers.profileEdit,
		speechOutput: controllers.speechOutput,
		targetSelection: controllers.targetSelection,
		targetSilence: controllers.targetSilence,
	};
}
