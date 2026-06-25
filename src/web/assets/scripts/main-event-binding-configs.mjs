import { registerAppEventBindings } from "./app-event-bindings.mjs";

export function mainEventBindingState({ state, mapFollow }) {
	return {
		getDisableMoveend: state.getDisableMoveend,
		getSelfTarget: state.getSelfTarget,
		setCurrentProfile: state.setCurrentProfile,
		setDisableMapPanTo: state.setDisableMapPanTo,
		setMapFollowSelf: mapFollow.setMapFollowSelf,
		setSortTableBy: state.setSortTableBy,
	};
}

export function mainEventBindingActions({
	targetMapRenderer,
	chartLayerController,
	profileActions,
}) {
	return {
		drawRangeRings: targetMapRenderer.drawRangeRings,
		handleBaseLayerChange: chartLayerController.handleBaseLayerChange,
		handleOverlayAdd: chartLayerController.handleOverlayAdd,
		handleOverlayRemove: chartLayerController.handleOverlayRemove,
		refreshProfilesFromServer: profileActions.refreshProfilesFromServer,
		saveCollisionProfiles: profileActions.saveCollisionProfiles,
		updateHarbourDisplay: targetMapRenderer.updateHarbourDisplay,
	};
}

export function mainEventBindingConfig({
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
	mapFollow,
	targetMapRenderer,
	chartLayerController,
	profileActions,
}) {
	return {
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
		state: mainEventBindingState({ state, mapFollow }),
		actions: mainEventBindingActions({
			targetMapRenderer,
			chartLayerController,
			profileActions,
		}),
	};
}
