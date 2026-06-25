export function clearSelectedBoatMarker({
	map,
	targets,
	selfMmsi,
	selectedVesselMmsi,
	selectionMarkers,
	setSelectedVesselMmsi,
	updateSingleVesselUI,
}) {
	const { blueBoxIcon, blueCircle1, blueCircle2 } = selectionMarkers;
	blueBoxIcon.removeFrom(map);
	blueCircle1.removeFrom(map);
	blueCircle2.removeFrom(map);

	if (!selectedVesselMmsi) return false;

	setSelectedVesselMmsi(null);
	updateSingleVesselUI(targets.get(selectedVesselMmsi));
	updateSingleVesselUI(targets.get(selfMmsi));
	return true;
}
