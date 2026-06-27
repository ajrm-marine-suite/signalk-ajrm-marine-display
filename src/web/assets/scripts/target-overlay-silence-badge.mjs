export function createSilenceBadgeMarker({
	latitude,
	longitude,
	leaflet,
}) {
	if (!leaflet?.marker || !leaflet?.divIcon) {
		throw new Error("Leaflet marker and divIcon factories are required");
	}
	return leaflet.marker([latitude, longitude], {
		icon: leaflet.divIcon({
			className: "ajrm-marine-silence-badge",
			html: "S",
			iconSize: [18, 18],
			iconAnchor: [-8, 22],
		}),
		interactive: false,
		zIndexOffset: 2500,
	});
}

export function updateSilenceBadgeMarker({
	map,
	marker,
	latitude,
	longitude,
}) {
	const latLng = [latitude, longitude];
	if (!sameLatLng(marker._ajrmMarineLatLng, latLng)) {
		marker.setLatLng(latLng);
		marker._ajrmMarineLatLng = latLng;
	}
	if (!map.hasLayer(marker)) marker.addTo(map);
}

export function removeSilenceBadgeMarker({ map, marker }) {
	marker?.removeFrom(map);
}

function sameLatLng(previous, next) {
	return previous?.[0] === next?.[0] && previous?.[1] === next?.[1];
}
