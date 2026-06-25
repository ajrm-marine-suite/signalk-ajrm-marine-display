export function gpsLossPopupConfig({
	modals,
	elements,
	requiredElement,
	pluginId,
	escapeHtml,
	feedback,
	getServerAlertEvents,
}) {
	return {
		modal: modals.alert,
		messageElement: elements.errorMessage,
		pauseButton: requiredElement("buttonPauseGpsAlarm"),
		pluginId,
		getEvents: () => getServerAlertEvents().getEvents(),
		escapeHtml,
		onPaused: async () => {
			feedback.showAlert(
				"Lost GPS spoken alarm paused until GPS returns",
				"success",
			);
			await getServerAlertEvents().refresh();
		},
		onError: () =>
			feedback.showAlert("Could not pause lost GPS alarm", "danger"),
	};
}

export function serverAlertEventsConfig({
	pluginId,
	targets,
	getSelfMmsi,
	gpsLossPopup,
}) {
	return {
		pluginId,
		targets,
		getSelfMmsi,
		gpsLossPopup,
	};
}
