import { toggleTargetSilenceFromTable } from "./target-selection-actions.mjs";

export function handleTargetTableMuteClick({
	event,
	getHttpResponse,
	pluginId,
	refreshServerAlertEvents,
	targets,
	targetSilence,
	updateTableOfTargets,
}) {
	const muteButton = event.target.closest("[data-target-mute-button]");
	if (!muteButton) return false;

	event.preventDefault();
	event.stopPropagation();
	const target = targets.get(muteButton.dataset.mmsi);
	if (target) {
		toggleTargetSilenceFromTable({
			pluginId,
			target,
			getHttpResponse,
			targetSilence,
			refreshServerAlertEvents,
			updateTableOfTargets,
		}).catch((error) => console.error("Error toggling target silence", error));
	}
	return true;
}
