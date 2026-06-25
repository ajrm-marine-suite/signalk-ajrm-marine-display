import {
	resetProfilesErrorMessage,
	resetProfilesPath,
	resetProfilesRequestOptions,
} from "./profile-edit-display-state.mjs";
import { applyProfileResetSelection } from "./profile-edit-view-state.mjs";

export async function resetProfilesToServerDefaults({
	confirmFn = window.confirm,
	fetchFn = fetch,
	setTimeoutFn = setTimeout,
	pluginId,
	controls,
	normalizeCollisionProfiles,
	setProfiles,
	setupProfileEditView,
	updateSensitivityControls,
	showAlert,
	refresh,
	onError = (error) => console.error("Error factory resetting profiles", error),
}) {
	if (!confirmFn("Factory reset every AJRM Marine profile?")) return false;
	try {
		const response = await fetchFn(
			resetProfilesPath(pluginId),
			resetProfilesRequestOptions(),
		);
		if (!response.ok) {
			throw new Error(resetProfilesErrorMessage(response.status));
		}
		const profiles = normalizeCollisionProfiles(await response.json());
		setProfiles(profiles);
		applyProfileResetSelection(controls, profiles.current);
		setupProfileEditView(controls.selectProfileToEdit.value);
		updateSensitivityControls(profiles.current);
		showAlert("Profiles reset to size-aware defaults", "success");
		setTimeoutFn(refresh, 250);
		return true;
	} catch (error) {
		onError(error);
		showAlert("Factory reset failed", "danger");
		return false;
	}
}
