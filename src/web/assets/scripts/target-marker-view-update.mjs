export function updateTargetMarkerView({
	boatMarker,
	target,
	icon,
	selectionMarkers,
	selectedVesselMmsi,
	targetOverlays,
}) {
	const latLng = [target.latitude, target.longitude];
	setMarkerLatLngIfChanged(boatMarker, latLng);
	setMarkerIconIfChanged(boatMarker, icon);
	setMarkerOpacityIfChanged(boatMarker, target.alarmIsMuted ? 0.45 : 1);
	targetOverlays.updateSilenceBadge(target);

	if (target.mmsi === selectedVesselMmsi && selectionMarkers.blueBoxIcon) {
		setMarkerLatLngIfChanged(selectionMarkers.blueBoxIcon, latLng);
	}

	boatMarker.mmsi = target.mmsi;
}

export function setMarkerLatLngIfChanged(marker, latLng) {
	if (sameLatLng(marker._ajrmMarineLatLng, latLng)) return false;
	marker.setLatLng(latLng);
	marker._ajrmMarineLatLng = latLng;
	return true;
}

export function setMarkerIconIfChanged(marker, icon) {
	const signature = markerIconSignature(icon);
	if (marker._ajrmMarineIconSignature === signature) return false;
	marker.setIcon(icon);
	marker._ajrmMarineIconSignature = signature;
	return true;
}

export function setMarkerOpacityIfChanged(marker, opacity) {
	if (marker._ajrmMarineOpacity === opacity) return false;
	marker.setOpacity(opacity);
	marker._ajrmMarineOpacity = opacity;
	return true;
}

function sameLatLng(previous, next) {
	return previous?.[0] === next?.[0] && previous?.[1] === next?.[1];
}

function markerIconSignature(icon) {
	const options = icon?.options;
	if (!options) return icon;
	return [
		options.className || "",
		options.html || "",
		coordinateList(options.iconAnchor),
		coordinateList(options.iconSize),
	].join("|");
}

function coordinateList(value) {
	return Array.isArray(value) ? value.join(",") : "";
}
