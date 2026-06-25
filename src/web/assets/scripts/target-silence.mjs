import {
	applyInitialTargetMuteData,
	applyServerTargetMuteState,
} from "./target-silence-server-state.mjs";
import { createTargetSilenceControllerCommands } from "./target-silence-controller-commands.mjs";
import { createTargetSilenceViewController } from "./target-silence-view-controller.mjs";

export function createTargetSilenceController({
	pluginId,
	targets,
	getSelfMmsi,
	getSelectedVesselMmsi,
	getServerAlertEvents,
	getHttpResponse,
	refreshServerAlertEvents,
	updateSingleVesselUI,
	updateSelectedVesselProperties,
	updateTableOfTargets,
	showAlert,
}) {
	let initialMuteDataApplied = false;
	const viewController = createTargetSilenceViewController({
		documentRef: document,
		getServerAlertEvents,
		targets,
		getSelfMmsi,
	});

	function updateTargetFromServer(serverTarget, alarmIsMuted = undefined) {
		return applyServerTargetMuteState({
			targets,
			serverTarget,
			alarmIsMuted,
			selectedVesselMmsi: getSelectedVesselMmsi(),
			updateSingleVesselUI,
			updateSelectedVesselProperties,
		});
	}

	function applyInitialMuteData(pluginTargets) {
		if (initialMuteDataApplied) return;
		initialMuteDataApplied = true;
		applyInitialTargetMuteData({ targets, pluginTargets });
	}
	const commands = createTargetSilenceControllerCommands({
		pluginId,
		targets,
		getSelectedVesselMmsi,
		getHttpResponse,
		updateTargetFromServer,
		refreshServerAlertEvents,
		updateTableOfTargets,
		showAlert,
	});

	return {
		applyInitialMuteData,
		applyServerMuteState: updateTargetFromServer,
		handleButtonMuteToggle: commands.handleButtonMuteToggle,
		refreshTargetMuteState: commands.refreshTargetMuteState,
		silenceCurrentAlerts: commands.silenceCurrentAlerts,
		unsilenceAllTargets: commands.unsilenceAllTargets,
		updateButtonMuteToggleIcon: viewController.updateButtonMuteToggleIcon,
		updateGlobalSilenceControls: viewController.updateGlobalSilenceControls,
	};
}
