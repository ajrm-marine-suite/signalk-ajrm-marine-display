import { applyBoatMarkerSelection } from "./target-selection-actions.mjs";
import { shouldSelectBoatMarker } from "./target-selection-state.mjs";

export function selectBoatMarkerForDetails({
	boatMarker,
	getSelectedVesselMmsi,
	getSelfMmsi,
	getSelectionMarkers,
	map,
	setSelectedVesselMmsi,
	targets,
	updateSingleVesselUI,
}) {
	if (!boatMarker) return;
	const selfMmsi = getSelfMmsi();
	const selectedVesselMmsi = getSelectedVesselMmsi();

	if (
		!shouldSelectBoatMarker({
			markerMmsi: boatMarker.mmsi,
			selfMmsi,
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
