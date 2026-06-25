import { boatMarkerFromClosebyListClick } from "./closeby-boat-list.mjs";

export function selectTargetFromClosebyList({
	event,
	boatMarkers,
	closebyModal,
	closebyModalElement,
	selectBoatMarker,
	showClosebyDetailsAfterChooser,
	showSelectedVesselDetails,
}) {
	const boatMarker = boatMarkerFromClosebyListClick(event, boatMarkers);
	if (!boatMarker) return;
	selectBoatMarker(boatMarker);
	showClosebyDetailsAfterChooser({
		boatMarker,
		closebyModalElement,
		closebyModal,
		showSelectedVesselDetails,
	});
}
