import { createTargetSilenceController } from "./target-silence.mjs";

export function createConfiguredTargetSilenceController({
	pluginId,
	targets,
	getSelfMmsi,
	getSelectedVesselMmsi,
	serverAlertEvents,
	getHttpResponse,
	getTargetMapRenderer,
	showAlert,
}) {
	return createTargetSilenceController({
		pluginId,
		targets,
		getSelfMmsi,
		getSelectedVesselMmsi,
		getServerAlertEvents: () => serverAlertEvents.getEvents(),
		getHttpResponse,
		refreshServerAlertEvents: serverAlertEvents.refresh,
		updateSingleVesselUI: (...args) =>
			getTargetMapRenderer()?.updateSingleVesselUI(...args),
		updateSelectedVesselProperties: (...args) =>
			getTargetMapRenderer()?.updateSelectedVesselProperties(...args),
		updateTableOfTargets: (...args) =>
			getTargetMapRenderer()?.updateTableOfTargets(...args),
		showAlert,
	});
}
