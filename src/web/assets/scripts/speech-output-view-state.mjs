import { muteButtonState } from "./speech-output-state.mjs";

export function applyMuteButtonState({ mutedControl, muteButton }) {
	mutedControl.disabled = false;
	if (!muteButton) return;
	const state = muteButtonState({ muted: mutedControl.checked });
	muteButton.classList.toggle("btn-danger", state.danger);
	muteButton.classList.toggle("btn-success", state.success);
	muteButton.classList.toggle("btn-outline-danger", false);
	muteButton.textContent = state.text;
}
