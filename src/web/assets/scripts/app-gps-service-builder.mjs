import {
	gpsLossPopupConfig,
	serverAlertEventsConfig,
} from "./app-service-builder-configs.mjs";

export function createGpsAlertServices({
	createGpsLossPopup,
	createServerAlertEvents,
	modals,
	elements,
	requiredElement,
	pluginId,
	targets,
	getSelfMmsi,
	escapeHtml,
	feedback,
}) {
	let serverAlertEvents;
	const gpsLossPopup = createGpsLossPopup(gpsLossPopupConfig({
		modal: modals.alert,
		modals,
		elements,
		requiredElement,
		pluginId,
		escapeHtml,
		feedback,
		getServerAlertEvents: () => serverAlertEvents,
	}));
	serverAlertEvents = createServerAlertEvents(serverAlertEventsConfig({
		pluginId,
		targets,
		getSelfMmsi,
		gpsLossPopup,
	}));

	return {
		gpsLossPopup,
		serverAlertEvents,
	};
}
