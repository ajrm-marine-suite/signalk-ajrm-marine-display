export function hasUnsilencedAlertTargets({ alertEvents, targets }) {
	return alertEvents.some((event) => {
		const target = targets.get(String(event.mmsi || ""));
		return target && !target.alarmIsMuted;
	});
}

export function hasSilencedTargets({ targets, selfMmsi }) {
	return Array.from(targets.values()).some(
		(target) => target.mmsi !== selfMmsi && target.alarmIsMuted,
	);
}

export function muteToggleIconClass(target) {
	return target?.alarmIsMuted ? "bi bi-volume-mute-fill" : "bi bi-volume-up-fill";
}

export function silencedAlertMessage(count) {
	return `${count || 0} current alert${count === 1 ? "" : "s"} silenced`;
}

export function unsilencedTargetMessage(count) {
	return `${count || 0} target${count === 1 ? "" : "s"} unsilenced`;
}
