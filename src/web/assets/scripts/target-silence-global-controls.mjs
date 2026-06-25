import {
	hasSilencedTargets,
	hasUnsilencedAlertTargets,
} from "./target-silence-state.mjs";
import { applyGlobalSilenceButtonState } from "./target-silence-view-state.mjs";

export function updateGlobalTargetSilenceControls({
	alertEvents,
	targets,
	selfMmsi,
	documentRef = document,
	applyButtonState = applyGlobalSilenceButtonState,
}) {
	const hasUnsilencedAlerts = hasUnsilencedAlertTargets({
		alertEvents,
		targets,
	});
	const hasSilenced = hasSilencedTargets({
		targets,
		selfMmsi,
	});
	applyButtonState({
		documentRef,
		hasUnsilencedAlerts,
		hasSilenced,
	});
	return { hasUnsilencedAlerts, hasSilenced };
}
