/**
 * Coordinates profile edit size in the AJRM Marine Display browser application.
 */

import { updateControllerSizeControls } from "./profile-edit-controller-state.mjs";
import { saveVesselSizeConfigFromControls } from "./profile-edit-size-controls.mjs";

export function createProfileEditSizeController({
	getProfiles,
	getNormalizedProfiles,
	sizeControls,
	normalizeVesselSizeConfig,
	setProfiles,
	saveProfiles,
	updateSizeControls = updateControllerSizeControls,
	saveSizeConfig = saveVesselSizeConfigFromControls,
}) {
	function updateControls() {
		return updateSizeControls({
			sizeControls,
			config: getProfiles()?.vesselSize,
			normalizeVesselSizeConfig,
		});
	}

	function handleChange() {
		return saveSizeConfig({
			profiles: getNormalizedProfiles(),
			sizeControls,
			normalizeVesselSizeConfig,
			setProfiles,
			saveProfiles,
		});
	}

	return {
		handleChange,
		updateControls,
	};
}
