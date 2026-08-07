import { currentGpsLossEvent } from "./alert-events.mjs";
import { gpsLossPopupHtml } from "./gps-loss-popup-state.mjs";

export function createGpsLossPopupController({
	modal,
	messageElement,
	pauseButton,
	getEvents,
	escapeHtml,
	onPaused,
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
		closedEventId = event?.id || closedEventId;
		isOpen = false;
		modal.hide();
		await onPaused?.();
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
