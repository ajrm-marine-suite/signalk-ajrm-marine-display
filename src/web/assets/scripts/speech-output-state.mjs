/**
 * Owns state and transitions for speech output in the AJRM Marine Display browser application.
 */

export function muteButtonState({ muted }) {
	return {
		danger: muted,
		success: !muted,
		text: muted ? "All sounds muted" : "Sounds enabled",
	};
}

export function muteStatusText({ muted }) {
	return muted ? "Muted manually." : "Sound enabled.";
}
