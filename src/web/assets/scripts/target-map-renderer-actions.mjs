import { renderTargetCounts } from "./target-counts.mjs";

export function renderRendererTargetCounts({ countState, countElements }) {
	const counts = countState.snapshot();
	renderTargetCounts({
		totalElement: countElements.total,
		filteredElement: countElements.filtered,
		alarmElement: countElements.alarm,
		total: counts.valid,
		filtered: counts.filtered,
		alarms: counts.alarm,
	});
}

export function createSelectedTargetAgedOutHandler({
	map,
	selectionMarkers,
	selectedVesselModal,
	setSelectedVesselMmsi,
}) {
	return () => {
		selectionMarkers.blueBoxIcon.removeFrom(map);
		selectionMarkers.blueCircle1.removeFrom(map);
		selectionMarkers.blueCircle2.removeFrom(map);
		selectedVesselModal.hide();
		setSelectedVesselMmsi(null);
	};
}
