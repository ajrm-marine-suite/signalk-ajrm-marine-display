import {
	findClosebyBoatMarkers,
	renderClosebyBoatList,
} from "./closeby-boat-list.mjs";
import { sortClosebyBoatMarkersByDistance } from "./closeby-boat-list-state.mjs";

export function handleTargetMarkerClick({
	event,
	boatMarkers,
	closebyListContainer,
	closebyModal,
	map,
	metersPerNm,
	getSelfMmsi,
	positionModalWindow,
	selectBoatMarker,
	showSelectedVesselDetails,
	targets,
}) {
	const boatMarker = event.target;
	const closebyBoatMarkers = findClosebyBoatMarkers({
		latLng: event.latlng,
		map,
		boatMarkers,
		selfMmsi: getSelfMmsi(),
		metersPerNm,
	});
	if (closebyBoatMarkers.length > 1) {
		sortClosebyBoatMarkersByDistance(closebyBoatMarkers);

		renderClosebyBoatList({
			container: closebyListContainer,
			closebyBoatMarkers,
			targets,
		});
		selectBoatMarker(closebyBoatMarkers[0]);
		positionModalWindow(boatMarker.getLatLng(), "modalClosebyBoats");
		closebyModal.show();
		return;
	}

	selectBoatMarker(boatMarker);
	showSelectedVesselDetails(boatMarker);
}
