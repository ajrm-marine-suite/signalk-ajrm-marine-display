import { isCollisionCandidateTarget } from "../../../shared/target-classification.mjs";

export function shouldShowTargetOverlay({ target, selfMmsi }) {
	return Boolean(
			target?.mmsi &&
			target.mmsi !== selfMmsi &&
			isCollisionCandidateTarget(target) &&
			target.isValid,
	);
}

export function cpaLimitRingRadiusMeters({
	criteria,
	cpaSensitivity,
}) {
	return (
		Number(criteria?.cpa || 0) *
		Math.max(0, Number(cpaSensitivity) || 0)
	);
}
