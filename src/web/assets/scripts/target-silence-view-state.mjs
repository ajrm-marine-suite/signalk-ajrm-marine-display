import { muteToggleIconClass } from "./target-silence-state.mjs";

export function applyGlobalSilenceButtonState({
	documentRef,
	hasUnsilencedAlerts,
	hasSilenced,
}) {
	for (const id of ["buttonMuteAllAlarms", "buttonSilenceAllTargets"]) {
		const button = documentRef.getElementById(id);
		if (button) button.disabled = !hasUnsilencedAlerts;
	}
	const unsilenceButton = documentRef.getElementById(
		"buttonUnsilenceAllTargets",
	);
	if (unsilenceButton) unsilenceButton.disabled = !hasSilenced;
}

export function applyMuteToggleIcon(documentRef, target) {
	documentRef.querySelector("#buttonMuteToggle > i").className =
		muteToggleIconClass(target);
}
