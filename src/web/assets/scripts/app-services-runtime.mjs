import {
	createAudioAlertServices,
	createCoreAppServices,
	createGpsAlertServices,
	createProfileEditServices,
} from "./app-service-builders.mjs";

export function createAppServicesRuntime({
	factories,
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
}) {
	const { feedback, getHttpResponse, collisionProfileService } =
		createCoreAppServices({
			createFeedback: factories.createFeedback,
			createHttp: factories.createHttp,
			createProfileService: factories.createProfileService,
			elements,
			modals,
			pluginId,
			defaultCollisionProfiles,
		});

	const { gpsLossPopup, serverAlertEvents } = createGpsAlertServices({
		createGpsLossPopup: factories.createGpsLossPopup,
		createServerAlertEvents: factories.createServerAlertEvents,
		modals,
		elements,
		requiredElement,
		pluginId,
		targets,
		getSelfMmsi,
		escapeHtml,
		feedback,
	});

	const { speechOutput, alertPopup } = createAudioAlertServices({
		createSpeechOutput: factories.createSpeechOutput,
		createAlertPopup: factories.createAlertPopup,
		window,
		pluginId,
		elements,
		modals,
		targets,
		escapeHtml,
		hornMp3Url,
		feedback,
		serverAlertEvents,
	});

	const { autoProfileSettings, profileActions, profileEdit } =
		createProfileEditServices({
			createAutoProfileSettings: factories.createAutoProfileSettings,
			createProfileActionSet: factories.createProfileActionSet,
			createProfileEdit: factories.createProfileEdit,
			pluginId,
			window,
			elements,
			collisionProfileService,
			getProfiles,
			setProfiles,
			setCurrentProfile,
			getHttpResponse,
			targets,
			getTargetMapRenderer,
			getRefreshController,
			feedback,
		});

	return {
		feedback,
		getHttpResponse,
		collisionProfileService,
		gpsLossPopup,
		serverAlertEvents,
		speechOutput,
		alertPopup,
		autoProfileSettings,
		profileActions,
		profileEdit,
	};
}
