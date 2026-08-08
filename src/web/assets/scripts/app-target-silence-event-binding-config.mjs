/**
 * Builds configuration for app target silence event binding in the AJRM Marine Display browser application.
 */

export const TARGET_SILENCE_CONTROL_IDS = {
	targetListPanel: "offcanvasTargetList",
	popupSilenceAll: "buttonMuteAllAlarms",
	sideWindowSilenceAll: "buttonSilenceAllTargets",
	sideWindowUnsilenceAll: "buttonUnsilenceAllTargets",
	selectedTargetToggle: "buttonMuteToggle",
};

export function targetSilenceElements(document) {
	return {
		targetListPanel: document.getElementById(
			TARGET_SILENCE_CONTROL_IDS.targetListPanel,
		),
		popupSilenceAll: document.getElementById(
			TARGET_SILENCE_CONTROL_IDS.popupSilenceAll,
		),
		sideWindowSilenceAll: document.getElementById(
			TARGET_SILENCE_CONTROL_IDS.sideWindowSilenceAll,
		),
		sideWindowUnsilenceAll: document.getElementById(
			TARGET_SILENCE_CONTROL_IDS.sideWindowUnsilenceAll,
		),
		selectedTargetToggle: document.getElementById(
			TARGET_SILENCE_CONTROL_IDS.selectedTargetToggle,
		),
	};
}
