export function shouldSelectBoatMarker({
	markerMmsi,
	selfMmsi,
	selectedVesselMmsi,
}) {
	return Boolean(
		markerMmsi &&
			markerMmsi !== selfMmsi &&
			markerMmsi !== selectedVesselMmsi,
	);
}

export function previousSelectedVesselMmsi(selectedVesselMmsi) {
	return selectedVesselMmsi || null;
}
