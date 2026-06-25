import { clearSelectedBoatMarker } from "./target-selection-clear.mjs";

export function clearSelectedTargetFromMapClick({
	getSelectedVesselMmsi,
	getSelfMmsi,
	getSelectionMarkers,
	map,
	setSelectedVesselMmsi,
	targets,
	updateSingleVesselUI,
}) {
	clearSelectedBoatMarker({
		map,
		targets,
		selfMmsi: getSelfMmsi(),
		selectedVesselMmsi: getSelectedVesselMmsi(),
		selectionMarkers: getSelectionMarkers(),
		setSelectedVesselMmsi,
		updateSingleVesselUI,
	});
}
