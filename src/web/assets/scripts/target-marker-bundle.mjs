export function createTargetMarkerBundle({
	L,
	map,
	target,
	selfMmsi,
	targetSelection,
	icon,
}) {
	const boatMarker = L.marker([0, 0], {
		icon,
		riseOnHover: true,
	}).addTo(map);

	boatMarker.bindTooltip("", {
		permanent: true,
		direction: "right",
		opacity: 0.7,
		offset: [25, 10],
		className: "map-labels",
		interactive: false,
		zIndexOffset: -999,
	});

	if (target.mmsi !== selfMmsi) {
		boatMarker.on("click", targetSelection.boatClicked);
	}

	const boatProjectedCourseLine = L.polyline([[]], {
		color: "gray",
		opacity: 0.7,
		interactive: false,
		dashArray: "20 10",
		zIndexOffset: -999,
	}).addTo(map);
	const boatFootprintPolygon =
		target.mmsi === selfMmsi || typeof L.polygon !== "function"
			? null
			: L.polygon([], {
					color: "#111111",
					weight: 1,
					opacity: 0.85,
					fillColor: "#111111",
					fillOpacity: 0.12,
					interactive: false,
				}).addTo(map);

	return { boatMarker, boatProjectedCourseLine, boatFootprintPolygon };
}
