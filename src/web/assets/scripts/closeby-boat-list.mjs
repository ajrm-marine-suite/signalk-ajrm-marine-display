import {
	closebyBoatListClasses,
	distancePixels,
} from "./closeby-boat-list-state.mjs";

export function renderClosebyBoatList({ container, closebyBoatMarkers, targets }) {
	container.innerHTML = "";

	closebyBoatMarkers.forEach((closebyBoatMarker, index) => {
		const target = targets.get(closebyBoatMarker.mmsi);
		if (!target) return;

		const item = document.createElement("a");
		item.href = "#";
		item.setAttribute("data-bs-toggle", "list");
		item.setAttribute("data-mmsi", target.mmsi);
		item.classList = closebyBoatListClasses({
			index,
			alarmState: target.alarmState,
		}).join(" ");
		item.appendChild(document.createTextNode(target.name));
		container.appendChild(item);
	});
}

export function findClosebyBoatMarkers({
	latLng,
	map,
	boatMarkers,
	selfMmsi,
	metersPerNm,
	pixelRadius = 30,
}) {
	const mapHeightInPixels = map.getSize().y;
	const mapHeightInMeters =
		Math.abs(map.getBounds().getNorth() - map.getBounds().getSouth()) *
		60 *
		metersPerNm;
	const mapScaleMetersPerPixel = mapHeightInMeters / mapHeightInPixels;
	const closebyBoatMarkers = [];

	boatMarkers.forEach((boatMarker, mmsi) => {
		if (mmsi === selfMmsi) return;

		const distanceInMeters = latLng.distanceTo(boatMarker.getLatLng());
		const distanceInPixels = distancePixels(
			distanceInMeters,
			mapScaleMetersPerPixel,
		);
		if (distanceInPixels < pixelRadius) {
			boatMarker.distanceInPixels = distanceInPixels;
			closebyBoatMarkers.push(boatMarker);
		}
	});

	return closebyBoatMarkers;
}

export function boatMarkerFromClosebyListClick(event, boatMarkers) {
	event.preventDefault();
	const item = event.target.closest("[data-mmsi]");
	if (!item) return null;
	return boatMarkers.get(item.dataset.mmsi) || null;
}
