import { GPS_LOSS_CONTROL_IDS } from "./app-display-settings-event-binding-config.mjs";

export function registerDisplaySettingsEventBindings({
	document,
	controls,
	autoProfileSettings,
	gpsLossPopup,
}) {
	controls.autoProfile.enabled.addEventListener(
		"change",
		autoProfileSettings.saveSettings,
	);
	document
		.getElementById(GPS_LOSS_CONTROL_IDS.pauseButton)
		.addEventListener("click", gpsLossPopup.pause);
	document
		.getElementById(GPS_LOSS_CONTROL_IDS.alertModal)
		.addEventListener("hidden.bs.modal", gpsLossPopup.handleModalHidden);
}
