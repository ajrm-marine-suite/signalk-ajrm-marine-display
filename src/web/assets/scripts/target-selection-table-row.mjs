export function selectTargetFromTableRow({
	eventTarget,
	boatMarkers,
	getSelfMmsi,
	map,
	selectBoatMarker,
	showSelectedVesselDetails,
	targetListOffcanvas,
}) {
	targetListOffcanvas.hide();
	const row = eventTarget.closest("tr");
	const mmsi = row?.dataset?.mmsi;
	const boatMarker = boatMarkers.get(mmsi);
	if (!boatMarker) return;

	selectBoatMarker(boatMarker);
	map.fitBounds([
		boatMarker.getLatLng(),
		boatMarkers.get(getSelfMmsi()).getLatLng(),
	]);
	showSelectedVesselDetails(boatMarker);
}
