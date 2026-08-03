import { applyBoatMarkerSelection } from "./target-selection-actions.mjs";
import { shouldSelectBoatMarker } from "./target-selection-state.mjs";

export function selectBoatMarkerForDetails({
	boatMarker,
	getSelectedVesselMmsi,
	getSelectionMarkers,
	map,
	setSelectedVesselMmsi,
	targets,
	updateSingleVesselUI,
}) {
	if (!boatMarker) return;
	const selectedVesselMmsi = getSelectedVesselMmsi();

	if (
		!shouldSelectBoatMarker({
			markerMmsi: boatMarker.mmsi,
			selectedVesselMmsi,
		})
	) {
		return;
	}

	applyBoatMarkerSelection({
		map,
		boatMarker,
		targets,
		selectionMarkers: getSelectionMarkers(),
		selectedVesselMmsi,
		setSelectedVesselMmsi,
		updateSingleVesselUI,
	});
}
