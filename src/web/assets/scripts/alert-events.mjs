/**
 * Implements the alert events responsibilities of the AJRM Marine Display browser application.
 */

export function currentGpsLossEvent(events) {
	return events.find((event) => event?.category === "gps");
}

export function serverEventToAlarmState(event) {
	if (event?.uiSeverity === "danger") return "danger";
	if (event?.uiSeverity === "warning") return "warning";
	return null;
}

export function escapeHtml(value) {
	return String(value || "").replace(
		/[&<>"']/g,
		(char) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			})[char],
	);
}
