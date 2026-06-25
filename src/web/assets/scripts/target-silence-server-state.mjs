export function applyServerTargetMuteState({
	targets,
	serverTarget,
	alarmIsMuted = undefined,
	selectedVesselMmsi,
	updateSingleVesselUI,
	updateSelectedVesselProperties,
}) {
	const target = targets.get(String(serverTarget?.mmsi));
	if (!target) return null;
	target.alarmIsMuted =
		typeof alarmIsMuted === "boolean"
			? alarmIsMuted
			: serverTarget.alarmIsMuted === true;
	updateSingleVesselUI(target);
	if (target.mmsi === selectedVesselMmsi) {
		updateSelectedVesselProperties(target);
	}
	return target;
}

export function applyInitialTargetMuteData({ targets, pluginTargets }) {
	if (!pluginTargets) return 0;
	let applied = 0;
	for (const [mmsi, target] of targets.entries()) {
		const pluginTarget = pluginTargets[mmsi];
		if (pluginTarget?.alarmIsMuted) {
			target.alarmIsMuted = true;
			applied += 1;
		}
	}
	return applied;
}
