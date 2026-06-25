import {
	profileSensitivityControlValues,
	selectedProfileCriteriaForDataset,
	selectedVesselSize,
} from "./profile-edit-state.mjs";
import {
	applyProfileEditRangeDisplays,
	applyProfileEditRangeTicks,
	applySensitivityControlValues,
	profileEditRangeTicks,
} from "./profile-edit-view-state.mjs";
import { applyNormalizedVesselSizeConfig } from "./profile-edit-size-controls.mjs";

export function selectedControllerRangeCriteria({
	profiles,
	profileName,
	dataset,
	sizeControls,
}) {
	return selectedProfileCriteriaForDataset({
		profiles,
		profileName,
		dataset,
		sizeControls,
	});
}

export function normalizeProfilesForEdit({
	getProfiles,
	setProfiles,
	normalizeCollisionProfiles,
}) {
	const profiles = normalizeCollisionProfiles(getProfiles());
	setProfiles(profiles);
	return profiles;
}

export function updateControllerSizeControls({
	sizeControls,
	config,
	normalizeVesselSizeConfig,
}) {
	return applyNormalizedVesselSizeConfig({
		sizeControls,
		config,
		normalizeVesselSizeConfig,
	});
}

export function setupControllerProfileEditView({
	controls,
	sizeControls,
	profiles,
	profileName,
	documentObject = globalThis.document,
}) {
	const size = selectedVesselSize(sizeControls);
	const ticks = profileEditRangeTicks({
		profiles,
		profileName,
		size,
	});
	applyProfileEditRangeTicks(controls, ticks);
	applyProfileEditRangeDisplays({
		controls,
		profiles,
		profileName,
		size,
		documentRef: documentObject,
	});
	return ticks;
}

export function updateControllerSensitivityControls({
	profile,
	sensitivityControls,
}) {
	if (!profile) return null;
	const values = profileSensitivityControlValues(profile);
	applySensitivityControlValues(sensitivityControls, values);
	return values;
}
