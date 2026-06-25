import {
	alertPopupClass,
	alertPopupMessage,
	isVisiblePopupEvent,
	shouldPlayPopupSound,
} from "./alert-popup-state.mjs";

export function createAlertPopupController({
	modal,
	container,
	controls,
	getEvents,
	getTarget,
	escapeHtml,
	hornUrl,
}) {
	function visiblePopupEvents() {
		return getEvents().filter((event) => {
			const target = getTarget(String(event.mmsi || ""));
			return isVisiblePopupEvent(event, target);
		});
	}

	function renderEvent(event) {
		const className = alertPopupClass(event.uiSeverity);
		const message = alertPopupMessage(event);
		return `<div class="alert ${className}" role="alert"><div class="fw-semibold">${escapeHtml(message)}</div></div>`;
	}

	function playPopupSound() {
		if (
			!shouldPlayPopupSound({
				alertPopupSound: controls.alertPopupSound.checked,
			})
		) {
			return;
		}
		new Audio(hornUrl).play();
	}

	function show() {
		if (!controls.showAlarmPopup.checked) return;
		const events = visiblePopupEvents();
		if (!events.length) return;
		container.innerHTML = events.map(renderEvent).join("");
		modal.show();
		playPopupSound();
	}

	return {
		show,
	};
}
