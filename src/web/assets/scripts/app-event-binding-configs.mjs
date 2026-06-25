export function chartLayerEventBindingConfig({ map, actions }) {
	return {
		map,
		handleBaseLayerChange: actions.handleBaseLayerChange,
		handleOverlayAdd: actions.handleOverlayAdd,
		handleOverlayRemove: actions.handleOverlayRemove,
	};
}

export function targetSelectionEventBindingConfig({
	map,
	document,
	controls,
	controllers,
	state,
}) {
	return {
		map,
		document,
		selectTableSort: controls.selectTableSort,
		targetSelection: controllers.targetSelection,
		setSortTableBy: state.setSortTableBy,
	};
}

export function profileEventBindingConfig({
	document,
	controls,
	controllers,
	state,
	actions,
}) {
	return {
		document,
		controls,
		profileEdit: controllers.profileEdit,
		autoProfileSettings: controllers.autoProfileSettings,
		offcanvasProfiles: controllers.offcanvasProfiles,
		offcanvasSettings: controllers.offcanvasSettings,
		offcanvasEditProfiles: controllers.offcanvasEditProfiles,
		state,
		refreshProfilesFromServer: actions.refreshProfilesFromServer,
		saveCollisionProfiles: actions.saveCollisionProfiles,
	};
}

export function targetSilenceEventBindingConfig({ document, controllers }) {
	return {
		document,
		targetSilence: controllers.targetSilence,
	};
}

export function speechEventBindingConfig({ controls, controllers }) {
	return {
		controls: controls.speech,
		speechOutput: controllers.speechOutput,
	};
}

export function displaySettingsEventBindingConfig({
	document,
	controls,
	controllers,
	actions,
}) {
	return {
		document,
		controls,
		autoProfileSettings: controllers.autoProfileSettings,
		gpsLossPopup: controllers.gpsLossPopup,
		updateHarbourDisplay: actions.updateHarbourDisplay,
	};
}

export function mapFollowEventBindingConfig({
	map,
	state,
	controllers,
	actions,
}) {
	return {
		map,
		state,
		autoCharts: controllers.autoCharts,
		drawRangeRings: actions.drawRangeRings,
		labelCollision: controllers.labelCollision,
	};
}
