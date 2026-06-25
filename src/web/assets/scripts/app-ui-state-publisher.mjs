export const AIS_PLUS_UI_STATE_EVENT = "ais-plus-ui-state";
export const AIS_PLUS_LATEST_UI_STATE_KEY = "aisPlusLatestUiState";

export function publishUiStateToWindow(
	uiState,
	windowObject = globalThis.window,
) {
	if (
		!uiState ||
		typeof uiState !== "object" ||
		Array.isArray(uiState) ||
		!windowObject
	) {
		return false;
	}
	windowObject[AIS_PLUS_LATEST_UI_STATE_KEY] = uiState;

	const EventConstructor = windowObject.CustomEvent || globalThis.CustomEvent;
	if (
		typeof windowObject.dispatchEvent === "function" &&
		typeof EventConstructor === "function"
	) {
		windowObject.dispatchEvent(
			new EventConstructor(AIS_PLUS_UI_STATE_EVENT, {
				detail: { uiState },
			}),
		);
	}
	return true;
}
