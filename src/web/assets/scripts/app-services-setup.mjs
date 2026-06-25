import { resolveAppServiceFactories } from "./app-service-factories.mjs";
import { createAppServicesRuntime } from "./app-services-runtime.mjs";
import {
	createConfiguredRequiredElement,
	initializeAppServiceWindowState,
} from "./app-services-setup-configs.mjs";

export {
	createConfiguredRequiredElement,
	initializeAppServiceWindowState,
} from "./app-services-setup-configs.mjs";

export function createConfiguredAppServices({
	window,
	elements,
	modals,
	offcanvas,
	speechControls,
	mapControls,
	autoProfileControls,
	sizeControls,
	pluginId,
	defaultCollisionProfiles,
	hornMp3Url,
	escapeHtml,
	targets,
	getSelfMmsi,
	getProfiles,
	setProfiles,
	setCurrentProfile,
	getTargetMapRenderer,
	getRefreshController,
	setStationaryMuteThreshold,
	factories = {},
}) {
	const {
		createFeedback,
		createHttp,
		createProfileService,
		createGpsLossPopup,
		createServerAlertEvents,
		createSpeechOutput,
		createAlertPopup,
		createAutoProfileSettings,
		createProfileActionSet,
		createProfileEdit,
		getRequiredElement,
	} = resolveAppServiceFactories(factories);
	const requiredElement = createConfiguredRequiredElement({
		window,
		getRequiredElement,
	});

	initializeAppServiceWindowState({
		window,
		offcanvas,
		speechControls,
		mapControls,
		autoProfileControls,
		sizeControls,
		setStationaryMuteThreshold,
	});

	return createAppServicesRuntime({
		factories: {
			createFeedback,
			createHttp,
			createProfileService,
			createGpsLossPopup,
			createServerAlertEvents,
			createSpeechOutput,
			createAlertPopup,
			createAutoProfileSettings,
			createProfileActionSet,
			createProfileEdit,
		},
		elements,
		modals,
		window,
		pluginId,
		defaultCollisionProfiles,
		requiredElement,
		hornMp3Url,
		escapeHtml,
		targets,
		getSelfMmsi,
		getProfiles,
		setProfiles,
		setCurrentProfile,
		getTargetMapRenderer,
		getRefreshController,
	});
}
