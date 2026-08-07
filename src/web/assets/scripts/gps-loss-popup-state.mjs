export function gpsLossPopupHtml(event = {}, escapeHtml) {
	return `<strong>${escapeHtml(
		event.uiLabel || "Lost GPS",
	)}</strong><br>${escapeHtml(
		event.message || "No GPS position available.",
	)}<br><span class="small">Dismiss closes this popup. Use Sounds Off if you need to mute repeated warnings.</span>`;
}
