import { initializeProfileEditView } from "./app-profile-edit-startup.mjs";
import { startAppRefreshLoop } from "./app-refresh-loop.mjs";
import { registerMainAppEventBindings } from "./main-event-binding-setup.mjs";

export function finalizeMainStartup({
	map,
	document,
	elements,
	window,
	offcanvas,
	autoCharts,
	autoProfileSettings,
	gpsLossPopup,
	targetSupport,
	profileEdit,
	speechOutput,
	targetSelection,
	state,
	mapFollow,
	targetMapRenderer,
	chartLayerController,
	profileActions,
	refreshController,
	registerEventBindings = registerMainAppEventBindings,
	initializeProfileEdit = initializeProfileEditView,
	startRefreshLoop = startAppRefreshLoop,
}) {
	registerEventBindings({
		map,
		document,
		elements,
		sizeControls: window.ajrmMarineSizeControls,
		speechControls: window.ajrmMarineSpeechControls,
		mapControls: window.ajrmMarineMapControls,
		autoProfileControls: window.ajrmMarineAutoProfileControls,
		offcanvas,
		controllers: {
			autoCharts,
			autoProfileSettings,
			gpsLossPopup,
			labelCollision: targetSupport.labelCollision,
			offcanvasEditProfiles: offcanvas.editProfiles,
			offcanvasProfiles: offcanvas.profiles,
			offcanvasSettings: offcanvas.settings,
			profileEdit,
			speechOutput,
			targetSelection,
			targetSilence: targetSupport.targetSilence,
		},
		state,
		mapFollow,
		targetMapRenderer,
		chartLayerController,
		profileActions,
	});

	initializeProfileEdit({ profileEdit });
	startRefreshLoop({ refreshController });
}
