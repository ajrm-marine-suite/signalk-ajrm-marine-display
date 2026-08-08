/**
 * Owns state and transitions for target selection in the AJRM Marine Display browser application.
 */

export function shouldSelectBoatMarker({
	markerMmsi,
	selectedVesselMmsi,
}) {
	return Boolean(markerMmsi && markerMmsi !== selectedVesselMmsi);
}

export function previousSelectedVesselMmsi(selectedVesselMmsi) {
	return selectedVesselMmsi || null;
}
