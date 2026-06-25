import { applyServerAlertEventsToTargets } from "./server-alert-event-application.mjs";
import { aisPlusAuthHeaders } from "./ais-plus-api-access.mjs";
import { alertEventsPath } from "./server-alert-events-routes.mjs";
import {
	applyServerAlertEventToTarget,
	resetTargetAlertDisplayState,
} from "./target-alert-event-projection.mjs";
import { alertEventsUiStateProjection } from "./ui-state-projection-reader.mjs";

export function createServerAlertEventsController({
	pluginId,
	targets,
	getSelfMmsi,
	gpsLossPopup,
}) {
	let events = [];

	function getEvents() {
		return events;
	}

	function applyEvents() {
		applyServerAlertEventsToTargets({
			events,
			targets,
			selfMmsi: getSelfMmsi(),
			resetTarget: resetTargetAlertDisplayState,
			applyEventToTarget: applyServerAlertEventToTarget,
		});
	}

	function setEvents(nextEvents) {
		events = Array.isArray(nextEvents) ? nextEvents : [];
		applyEvents();
		gpsLossPopup.update();
		return events;
	}

	function eventsFromUiState(uiState) {
		return alertEventsUiStateProjection(uiState);
	}

	async function refresh({ uiState, allowFallback = true } = {}) {
		const uiStateEvents = eventsFromUiState(uiState);
		if (uiStateEvents) return setEvents(uiStateEvents);
		if (!allowFallback) return events;

		try {
			const response = await fetch(alertEventsPath(pluginId), {
				credentials: "include",
				cache: "no-store",
				headers: aisPlusAuthHeaders(),
			});
			if (!response.ok) return events;

			const body = await response.json();
			return setEvents(body.events);
		} catch (_err) {
			return events;
		}
	}

	return { getEvents, refresh };
}
