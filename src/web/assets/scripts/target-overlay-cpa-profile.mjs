export function targetCpaRingProfile({
	target,
	collisionProfiles,
	normalizeCollisionProfiles,
	vesselSizeCategory,
	criteriaForSize,
}) {
	const normalizedProfiles = normalizeCollisionProfiles(collisionProfiles);
	const profile = normalizedProfiles[normalizedProfiles.current] || {};
	const size = target?.vesselSizeCategory || vesselSizeCategory(target);
	return {
		normalizedProfiles,
		warning: criteriaForSize(profile, "warning", size),
		danger: criteriaForSize(profile, "danger", size),
		cpaSensitivity: Math.max(0, Number(profile.cpaSensitivity ?? 1) || 0),
	};
}
