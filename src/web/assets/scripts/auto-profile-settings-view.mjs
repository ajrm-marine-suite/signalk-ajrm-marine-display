import {
	autoProfileEnabledFromSettings,
	autoProfileStatusClasses,
	shouldApplyAutoProfileStatus,
} from "./auto-profile-settings-state.mjs";

export function applyAutoProfileSettingsToControls({ controls, settings }) {
	controls.enabled.checked = autoProfileEnabledFromSettings(
		autoProfileSettingsFromResponse(settings),
	);
}

export function autoProfileSettingsBody({ controls }) {
	return {
		enabled: controls.enabled.checked,
	};
}

export function applyAutoProfileStatusToControls({
	controls,
	status,
	currentProfile,
	setCurrentProfile,
	updateSensitivityControls,
}) {
	const normalizedStatus = autoProfileStatusFromResponse(status);
	if (
		shouldApplyAutoProfileStatus({
			currentProfile,
			statusProfile: normalizedStatus.currentProfile,
		})
	) {
		setCurrentProfile(normalizedStatus.currentProfile);
		updateSensitivityControls(normalizedStatus.currentProfile);
	}
	if (normalizedStatus.options) {
		applyAutoProfileSettingsToControls({
			controls,
			settings: normalizedStatus.options,
		});
	}
	if (normalizedStatus.message) {
		const classes = autoProfileStatusClasses(normalizedStatus);
		controls.status.textContent = normalizedStatus.message;
		controls.status.classList.toggle("alert-warning", classes.warning);
		controls.status.classList.toggle("alert-secondary", classes.secondary);
	}
}

export function autoProfileSettingsFromResponse(response) {
	return (
		response?.autoProfile?.settings ||
		response?.settings ||
		response?.options ||
		response ||
		{}
	);
}

export function autoProfileStatusFromResponse(response) {
	const projection = response?.autoProfile || response || {};
	const options = autoProfileSettingsFromResponse(projection);
	return {
		currentProfile: projection.currentProfile || projection.profile || "",
		message: projection.message || projection.status || "",
		options,
	};
}
