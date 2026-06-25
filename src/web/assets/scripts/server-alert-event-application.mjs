export function alertEventsByMmsi(events) {
	const byMmsi = new Map();
	for (const event of events || []) {
		const mmsi = String(event?.mmsi || "");
		if (mmsi) byMmsi.set(mmsi, event);
	}
	return byMmsi;
}

export function applyServerAlertEventsToTargets({
	events,
	targets,
	selfMmsi,
	resetTarget,
	applyEventToTarget,
}) {
	const byMmsi = alertEventsByMmsi(events);
	targets.forEach((target) => {
		if (target.mmsi === selfMmsi) return;
		resetTarget(target);

		const event = byMmsi.get(String(target.mmsi));
		if (!event) return;

		applyEventToTarget(target, event);
	});
}
