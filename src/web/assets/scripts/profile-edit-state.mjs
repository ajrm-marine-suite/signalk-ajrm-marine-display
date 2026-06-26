export function selectedVesselSize(sizeControls) {
	return sizeControls.category.value || "small";
}

export function vesselSizeConfigFromControls(sizeControls) {
	return {
		smallMaxLengthMeters: sizeControls.smallMax.value,
		mediumMaxLengthMeters: sizeControls.mediumMax.value,
		unknownLengthCategory: sizeControls.unknown.value,
	};
}

export function selectedProfileCriteria({
	profiles,
	profileName,
	alarmType,
	size,
}) {
	return profiles[profileName][alarmType].bySize[size];
}

export function selectedProfileCriteriaForDataset({
	profiles,
	profileName,
	dataset,
	sizeControls,
}) {
	return selectedProfileCriteria({
		profiles,
		profileName,
		alarmType: dataset.alarmType,
		size: selectedVesselSize(sizeControls),
	});
}

export function sensitivityPercent(value) {
	return Math.round((value ?? 1) * 100);
}

export function profileSensitivityControlValues(profile) {
	return {
		cpa: sensitivityPercent(profile.cpaSensitivity),
		tcpa: sensitivityPercent(profile.tcpaLookahead),
		repeat: sensitivityPercent(profile.repeatSensitivity),
	};
}

export function applySensitivityFromControls({ profile, sensitivityControls }) {
	profile.cpaSensitivity = Number(sensitivityControls.cpaRange.value) / 100;
	profile.tcpaLookahead = Number(sensitivityControls.tcpaRange.value) / 100;
	profile.repeatSensitivity = Number(sensitivityControls.repeatRange.value) / 100;
}

export function resetProfileSensitivity(profile) {
	profile.cpaSensitivity = 1;
	profile.tcpaLookahead = 1;
	profile.repeatSensitivity = 1;
}
