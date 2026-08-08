/**
 * Implements the target selection map click responsibilities of the AJRM Marine Display browser application.
 */

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
