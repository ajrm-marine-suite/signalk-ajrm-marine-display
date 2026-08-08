/**
 * Implements the target selection details responsibilities of the AJRM Marine Display browser application.
 */

export function showSelectedVesselDetails({
	boatMarker,
	positionModalWindow,
	showModalSelectVesselProperties,
	targets,
}) {
	if (!boatMarker) return;
	positionModalWindow(boatMarker.getLatLng(), "modalSelectedVesselProperties");
	showModalSelectVesselProperties(targets.get(boatMarker.mmsi));
}
