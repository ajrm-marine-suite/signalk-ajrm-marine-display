export function closebyBoatListClasses({ index, alarmState } = {}) {
	const classes = ["list-group-item", "list-group-item-action"];
	if (index === 0) classes.push("active");
	if (alarmState === "danger") {
		classes.push("list-group-item-danger");
	} else if (alarmState === "warning") {
		classes.push("list-group-item-warning");
	}
	return classes;
}

export function distancePixels(distanceMeters, metersPerPixel) {
	return distanceMeters / metersPerPixel;
}

export function sortClosebyBoatMarkersByDistance(closebyBoatMarkers) {
	return closebyBoatMarkers.sort(
		(a, b) => a.distanceInPixels - b.distanceInPixels,
	);
}
