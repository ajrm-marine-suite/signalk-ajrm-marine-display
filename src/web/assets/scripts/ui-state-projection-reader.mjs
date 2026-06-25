import { uiStatePath } from "./ui-state-routes.mjs";

export function uiStateObjectProjection(key) {
	return (uiState) => {
		const value = uiState?.[key];
		return value && typeof value === "object" && !Array.isArray(value)
			? value
			: null;
	};
}

export function uiStateEventListProjection(key) {
	return (uiState) => {
		const value = uiState?.[key];
		if (Array.isArray(value)) return value;
		const events = value?.events;
		return Array.isArray(events) ? events : null;
	};
}

export const alertEventsUiStateProjection =
	uiStateEventListProjection("alertEvents");
export const announcementLogUiStateProjection =
	uiStateObjectProjection("announcementLog");
export const autoProfileStatusUiStateProjection = uiStateObjectProjection(
	"autoProfileStatus",
);
export const browserSpeechEventsUiStateProjection = uiStateEventListProjection(
	"browserSpeechEvents",
);
export const connectionHintsUiStateProjection =
	uiStateObjectProjection("connectionHints");
export const dataHealthUiStateProjection = uiStateObjectProjection("dataHealth");
export const panelEventsUiStateProjection = uiStateObjectProjection("panelEvents");
export const speechOutputUiStateProjection =
	uiStateObjectProjection("speechOutput");

export async function readHttpUiStateProjection({
	pluginId,
	getHttpResponse,
	projection,
}) {
	try {
		const uiState = await getHttpResponse(uiStatePath(pluginId), {
			ignoreEmptyResponse: true,
		});
		return projection(uiState);
	} catch (_err) {
		return null;
	}
}

export async function readFetchUiStateProjection({
	pluginId,
	fetchFn,
	projection,
}) {
	try {
		const response = await fetchFn(uiStatePath(pluginId), {
			credentials: "include",
			cache: "no-store",
		});
		if (!response?.ok) return null;
		return projection(await response.json());
	} catch (_err) {
		return null;
	}
}
