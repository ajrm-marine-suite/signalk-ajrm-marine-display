import { currentGpsLossEvent } from "./alert-events.mjs";
import {
	ajrmMarineAuthHeaders,
	assertAisPlusResponseAllowed,
} from "./ajrm-marine-api-access.mjs";
import {
	gpsLossPausePath,
	gpsLossPopupHtml,
} from "./gps-loss-popup-state.mjs";

export function createGpsLossPopupController({
	modal,
	messageElement,
	pauseButton,
	pluginId,
	getEvents,
	escapeHtml,
	onPaused,
	onError,
}) {
	let isOpen = false;
	let closedEventId = null;

	function currentEvent() {
		return currentGpsLossEvent(getEvents());
	}

	function update() {
		const event = currentEvent();
		if (!event || event.muted) {
			pauseButton?.classList.add("d-none");
			if (isOpen) {
				isOpen = false;
				modal.hide();
			}
			return;
		}
		if (closedEventId === event.id) return;
		pauseButton?.classList.remove("d-none");
		messageElement.innerHTML = gpsLossPopupHtml(event, escapeHtml);
		isOpen = true;
		modal.show();
	}

	async function pause() {
		const event = currentEvent();
		try {
			const response = await fetch(gpsLossPausePath(pluginId), {
				credentials: "include",
				method: "POST",
				cache: "no-store",
				headers: ajrmMarineAuthHeaders(),
			});
			await assertAisPlusResponseAllowed(response, "AJRM Marine GPS alarm");
			if (!response.ok) {
				throw new Error(`GPS alarm pause failed: ${response.status}`);
			}
			closedEventId = event?.id || closedEventId;
			isOpen = false;
			modal.hide();
			await onPaused?.();
		} catch (error) {
			console.error("Error pausing lost GPS alarm", error);
			onError?.();
		}
	}

	function handleModalHidden() {
		const event = currentEvent();
		if (isOpen && event) {
			closedEventId = event.id;
		}
		isOpen = false;
	}

	return {
		currentEvent,
		handleModalHidden,
		pause,
		update,
	};
}
