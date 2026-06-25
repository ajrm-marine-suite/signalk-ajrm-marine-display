import { targetSilenceElements } from "./app-target-silence-event-binding-config.mjs";

export function registerTargetSilenceEventBindings({ document, targetSilence }) {
	const elements = targetSilenceElements(document);

	elements.targetListPanel.addEventListener(
		"show.bs.offcanvas",
		targetSilence.refreshTargetMuteState,
	);
	elements.popupSilenceAll.addEventListener(
		"click",
		targetSilence.silenceCurrentAlerts,
	);
	elements.sideWindowSilenceAll.addEventListener(
		"click",
		targetSilence.silenceCurrentAlerts,
	);
	elements.sideWindowUnsilenceAll.addEventListener(
		"click",
		targetSilence.unsilenceAllTargets,
	);
	elements.selectedTargetToggle.addEventListener(
		"click",
		targetSilence.handleButtonMuteToggle,
	);
}
