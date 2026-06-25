import {
	alertPopupServiceConfig,
	speechOutputServiceConfig,
} from "./app-service-builder-configs.mjs";

export function createAudioAlertServices({
	createSpeechOutput,
	createAlertPopup,
	window,
	pluginId,
	elements,
	modals,
	targets,
	escapeHtml,
	hornMp3Url,
	feedback,
	serverAlertEvents,
}) {
	const speechOutput = createSpeechOutput(speechOutputServiceConfig({
		window,
		pluginId,
		feedback,
	}));
	const alertPopup = createAlertPopup(alertPopupServiceConfig({
		window,
		elements,
		modals,
		targets,
		escapeHtml,
		hornMp3Url,
		serverAlertEvents,
	}));

	return {
		speechOutput,
		alertPopup,
	};
}
