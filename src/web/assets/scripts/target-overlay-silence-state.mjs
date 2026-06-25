import { shouldShowTargetOverlay } from "./target-overlay-state.mjs";

export function targetSilenceBadgeState({ target, selfMmsi }) {
	if (!shouldShowTargetOverlay({ target, selfMmsi })) {
		return { show: false, mmsi: target?.mmsi };
	}
	if (!target.alarmIsMuted) return { show: false, mmsi: target.mmsi };
	return {
		show: true,
		mmsi: target.mmsi,
		latitude: target.latitude,
		longitude: target.longitude,
	};
}
