import { normalizeVesselSizeConfig } from "./profile-settings-normalize.mjs";

export function vesselSizeCategory(target, vesselSizeConfig) {
	const config = normalizeVesselSizeConfig(vesselSizeConfig);
	const length = Number(target?.length);
	if (!Number.isFinite(length) || length <= 0) {
		return config.unknownLengthCategory;
	}
	if (length < config.smallMaxLengthMeters) return "small";
	if (length < config.mediumMaxLengthMeters) return "medium";
	return "large";
}

export function criteriaForSize(profile, alarmType, size) {
	return (
		profile?.[alarmType]?.bySize?.[size] ||
		profile?.[alarmType]?.bySize?.medium ||
		profile?.[alarmType] || { cpa: 0, tcpa: 0, speed: 0 }
	);
}
