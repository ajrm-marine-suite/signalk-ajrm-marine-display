export const AJRM_MARINE_UI_STATE_EVENT = "ajrm-marine-ui-state";
export const AJRM_MARINE_LATEST_UI_STATE_KEY = "ajrmMarineLatestUiState";

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
	windowObject[AJRM_MARINE_LATEST_UI_STATE_KEY] = uiState;

	const EventConstructor = windowObject.CustomEvent || globalThis.CustomEvent;
	if (
		typeof windowObject.dispatchEvent === "function" &&
		typeof EventConstructor === "function"
	) {
		windowObject.dispatchEvent(
			new EventConstructor(AJRM_MARINE_UI_STATE_EVENT, {
				detail: { uiState },
			}),
		);
	}
	return true;
}
