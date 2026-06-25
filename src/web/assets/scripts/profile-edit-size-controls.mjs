import { vesselSizeConfigFromControls } from "./profile-edit-state.mjs";

export function applyNormalizedVesselSizeConfig({
	sizeControls,
	config,
	normalizeVesselSizeConfig,
}) {
	const normalized = normalizeVesselSizeConfig(config);
	sizeControls.smallMax.value = normalized.smallMaxLengthMeters;
	sizeControls.mediumMax.value = normalized.mediumMaxLengthMeters;
	sizeControls.unknown.value = normalized.unknownLengthCategory;
	return normalized;
}

export function saveVesselSizeConfigFromControls({
	profiles,
	sizeControls,
	normalizeVesselSizeConfig,
	setProfiles,
	saveProfiles,
}) {
	profiles.vesselSize = normalizeVesselSizeConfig(
		vesselSizeConfigFromControls(sizeControls),
	);
	setProfiles(profiles);
	applyNormalizedVesselSizeConfig({
		sizeControls,
		config: profiles.vesselSize,
		normalizeVesselSizeConfig,
	});
	return saveProfiles();
}
