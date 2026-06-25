export function gpsLossPausePath(_pluginId) {
	return `/signalk/v1/api/ajrmMarineDisplay/pauseLostGps`;
}

export function gpsLossPopupHtml(event = {}, escapeHtml) {
	return `<strong>${escapeHtml(
		event.uiLabel || "Lost GPS",
	)}</strong><br>${escapeHtml(
		event.message || "No GPS position available.",
	)}<br><span class="small">Spoken warning repeats every 3 minutes until GPS returns or you pause it.</span>`;
}
