/**
 * Defines API routes and access helpers for UI state in the AJRM Marine Display browser application.
 */

export function panelEventsPath(_pluginId) {
	return `/signalk/v1/api/ajrmMarineDisplay/panelEvents`;
}

export function uiStatePath(_pluginId) {
	return `/signalk/v1/api/ajrmMarineDisplay/uiState`;
}
