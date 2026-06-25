export function applyProfileSensitivityChange({
	profiles,
	sensitivityControls,
	setProfiles,
	updateSensitivityControls,
	targets,
	updateSingleVesselUI,
	applySensitivityFromControls,
}) {
	const profile = profiles[profiles.current];
	applySensitivityFromControls({ profile, sensitivityControls });
	setProfiles(profiles);
	updateSensitivityControls(profiles.current);
	targets.forEach(updateSingleVesselUI);
}

export function resetProfileSensitivityChange({
	profiles,
	setProfiles,
	updateSensitivityControls,
	targets,
	updateSingleVesselUI,
	resetProfileSensitivity,
}) {
	const profile = profiles[profiles.current];
	resetProfileSensitivity(profile);
	setProfiles(profiles);
	updateSensitivityControls(profiles.current);
	targets.forEach(updateSingleVesselUI);
}
