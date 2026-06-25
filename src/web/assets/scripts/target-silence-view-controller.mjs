import { updateGlobalTargetSilenceControls } from "./target-silence-global-controls.mjs";
import { applyMuteToggleIcon } from "./target-silence-view-state.mjs";

export function createTargetSilenceViewController({
	documentRef,
	getServerAlertEvents,
	targets,
	getSelfMmsi,
	updateGlobalControls = updateGlobalTargetSilenceControls,
	applyToggleIcon = applyMuteToggleIcon,
}) {
	function updateGlobalSilenceControls() {
		updateGlobalControls({
			alertEvents: getServerAlertEvents(),
			targets,
			selfMmsi: getSelfMmsi(),
			documentRef,
		});
	}

	function updateButtonMuteToggleIcon(target) {
		applyToggleIcon(documentRef, target);
	}

	return {
		updateButtonMuteToggleIcon,
		updateGlobalSilenceControls,
	};
}
