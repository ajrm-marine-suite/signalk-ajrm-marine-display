export function alertPopupClass(uiSeverity) {
	return uiSeverity === "danger" ? "alert-danger" : "alert-warning";
}

export function alertPopupMessage(event = {}) {
	return (
		event.message ||
		`${event.displayName || event.mmsi || "Target"} ${event.uiLabel || "alert"}`
	);
}

export function isVisiblePopupEvent(event = {}, target) {
	return Boolean(target?.isValid && !target.alarmIsMuted && event.uiSeverity);
}

export function shouldPlayPopupSound({ alertPopupSound }) {
	return Boolean(alertPopupSound);
}
