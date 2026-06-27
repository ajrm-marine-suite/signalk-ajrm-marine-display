export function speechOutputServiceConfig({
	window,
	pluginId,
	feedback,
}) {
	return {
		controls: window.ajrmMarineSpeechControls,
		pluginId,
		showAlert: feedback.showAlert,
	};
}

export function alertPopupServiceConfig({
	window,
	elements,
	modals,
	targets,
	escapeHtml,
	hornMp3Url,
	serverAlertEvents,
}) {
	return {
		modal: modals.alarm,
		container: elements.alarmDiv,
		controls: window.ajrmMarineSpeechControls,
		getEvents: () => serverAlertEvents.getEvents(),
		getTarget: (mmsi) => targets.get(mmsi),
		escapeHtml,
		hornUrl: hornMp3Url,
	};
}
