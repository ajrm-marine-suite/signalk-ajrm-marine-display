export function finiteOr(value, fallback = 0) {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

export function normalizeVesselSizeConfig(value = {}, defaults = {}) {
	let smallMaxLengthMeters = finiteOr(
		value.smallMaxLengthMeters,
		defaults.smallMaxLengthMeters ?? 15,
	);
	let mediumMaxLengthMeters = finiteOr(
		value.mediumMaxLengthMeters,
		defaults.mediumMaxLengthMeters ?? 50,
	);
	if (smallMaxLengthMeters < 1) smallMaxLengthMeters = 1;
	if (mediumMaxLengthMeters <= smallMaxLengthMeters) {
		mediumMaxLengthMeters = smallMaxLengthMeters + 1;
	}
	return {
		smallMaxLengthMeters,
		mediumMaxLengthMeters,
		unknownLengthCategory: ["small", "medium"].includes(
			value.unknownLengthCategory,
		)
			? value.unknownLengthCategory
			: "small",
	};
}

export function normalizeCriteria(value = {}, fallback = {}) {
	const base = {
		cpa: finiteOr(value.cpa, finiteOr(fallback.cpa, 0)),
		tcpa: finiteOr(value.tcpa, finiteOr(fallback.tcpa, 0)),
		speed: finiteOr(value.speed, finiteOr(fallback.speed, 0)),
	};
	const bySize = {};
	for (const size of ["small", "medium", "large"]) {
		const sizeValue = value.bySize?.[size] || {};
		bySize[size] = {
			cpa: finiteOr(sizeValue.cpa, base.cpa),
			tcpa: finiteOr(sizeValue.tcpa, base.tcpa),
			speed: finiteOr(sizeValue.speed, base.speed),
		};
	}
	return { ...value, ...base, bySize };
}

export function normalizeCollisionProfiles(profiles, defaultProfiles) {
	const normalised = structuredClone(profiles || defaultProfiles);
	normalised.vesselSize = normalizeVesselSizeConfig(
		normalised.vesselSize,
		defaultProfiles.vesselSize,
	);
	for (const profileName of ["anchor", "harbor", "coastal", "offshore"]) {
		const profile = normalised[profileName] || {};
		const fallback = defaultProfiles[profileName] || {};
		normalised[profileName] = {
			cpaSensitivity: Math.max(
				0,
				finiteOr(profile.cpaSensitivity, finiteOr(fallback.cpaSensitivity, 1)),
			),
			tcpaLookahead: Math.max(
				0,
				finiteOr(profile.tcpaLookahead, finiteOr(fallback.tcpaLookahead, 1)),
			),
			repeatSensitivity: Math.max(
				0,
				finiteOr(
					profile.repeatSensitivity,
					finiteOr(fallback.repeatSensitivity, 1),
				),
			),
			warning: normalizeCriteria(profile.warning, fallback.warning),
			danger: normalizeCriteria(profile.danger, fallback.danger),
		};
	}
	if (!normalised.current || !normalised[normalised.current]) {
		normalised.current = "harbor";
	}
	return normalised;
}
