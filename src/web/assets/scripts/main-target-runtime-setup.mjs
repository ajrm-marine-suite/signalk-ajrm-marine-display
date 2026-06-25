import {
	mainTargetSupportConfig,
	mainTargetUiCollectionsConfig,
	mainTargetUiConstantsConfig,
	mainTargetUiIdentityConfig,
	mainTargetUiStateConfig,
} from "./main-target-runtime-config.mjs";

export function createMainTargetSupport({
	L,
	map,
	targets,
	serverAlertEvents,
	getHttpResponse,
	state,
	collisionProfileService,
	feedback,
	getTargetMapRenderer,
	createTargetSupport,
}) {
	return createTargetSupport(mainTargetSupportConfig({
		L,
		map,
		targets,
		serverAlertEvents,
		getHttpResponse,
		state,
		collisionProfileService,
		feedback,
		getTargetMapRenderer,
	}));
}

export function createMainTargetUi({
	map,
	collections,
	targetSupport,
	autoCharts,
	harbourDisplay,
	autoProfileSettings,
	speechOutput,
	serverAlertEvents,
	modals,
	offcanvas,
	elements,
	getHttpResponse,
	initialPluginTargets,
	alertPopup,
	state,
	mapControls,
	mapFollow,
	feedback,
	createTargetUi,
}) {
	return createTargetUi({
		map,
		...mainTargetUiIdentityConfig(),
		...mainTargetUiCollectionsConfig({ collections, targetSupport }),
		autoCharts,
		harbourDisplay,
		autoProfileSettings,
		speechOutput,
		serverAlertEvents,
		modals,
		offcanvas,
		elements,
		getHttpResponse,
		initialPluginTargets,
		alertPopup,
		...mainTargetUiStateConfig({
			state,
			mapControls,
			mapFollow,
			harbourDisplay,
		}),
		clearAlert: feedback.clearAlert,
		...mainTargetUiConstantsConfig(),
	});
}
