export function shouldSelectBoatMarker({
	markerMmsi,
	selectedVesselMmsi,
}) {
	return Boolean(markerMmsi && markerMmsi !== selectedVesselMmsi);
}

export function previousSelectedVesselMmsi(selectedVesselMmsi) {
	return selectedVesselMmsi || null;
}
