export async function applyTargetSilenceServerTargets({
	serverTargets,
	updateTargetFromServer,
	alarmIsMuted,
	refreshServerAlertEvents,
	updateTableOfTargets,
}) {
	for (const serverTarget of serverTargets || []) {
		updateTargetFromServer(serverTarget, alarmIsMuted);
	}
	await refreshServerAlertEvents();
	updateTableOfTargets();
}

export async function refreshTargetSilenceStateAction({
	fetchTargets,
	updateTargetFromServer,
	refreshServerAlertEvents,
	updateTableOfTargets,
}) {
	const serverTargets = await fetchTargets();
	await applyTargetSilenceServerTargets({
		serverTargets: Object.values(serverTargets || {}),
		updateTargetFromServer,
		refreshServerAlertEvents,
		updateTableOfTargets,
	});
	return serverTargets;
}

export async function toggleTargetSilenceAction({
	target,
	requestSetTargetSilence,
	updateTargetFromServer,
	refreshServerAlertEvents,
	updateTableOfTargets,
}) {
	if (!target) return null;
	const serverTarget = await requestSetTargetSilence({
		mmsi: target.mmsi,
		alarmIsMuted: !target.alarmIsMuted,
	});
	const updated = updateTargetFromServer(serverTarget) || target;
	await refreshServerAlertEvents();
	updateTableOfTargets();
	return updated;
}
