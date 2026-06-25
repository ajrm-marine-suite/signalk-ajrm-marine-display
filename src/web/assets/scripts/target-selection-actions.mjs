import { setAlarmIsMutedPath } from "./target-silence-routes.mjs";
import { previousSelectedVesselMmsi as selectedBeforeChange } from "./target-selection-state.mjs";

export async function toggleTargetSilenceFromTable({
	pluginId,
	target,
	getHttpResponse,
	targetSilence,
	refreshServerAlertEvents,
	updateTableOfTargets,
}) {
	const serverTarget = await getHttpResponse(
		setAlarmIsMutedPath(pluginId, target.mmsi, !target.alarmIsMuted),
		{ throwErrors: true, ignoreEmptyResponse: true },
	);
	targetSilence.applyServerMuteState(serverTarget);
	await refreshServerAlertEvents();
	updateTableOfTargets();
}

export function applyBoatMarkerSelection({
	map,
	boatMarker,
	targets,
	selectionMarkers,
	selectedVesselMmsi,
	setSelectedVesselMmsi,
	updateSingleVesselUI,
}) {
	const { blueBoxIcon } = selectionMarkers;
	blueBoxIcon.setLatLng(boatMarker.getLatLng());
	blueBoxIcon.addTo(map);

	boatMarker.setZIndexOffset(1000);

	const oldSelectedVesselMmsi = selectedBeforeChange(selectedVesselMmsi);

	setSelectedVesselMmsi(boatMarker.mmsi);
	updateSingleVesselUI(targets.get(boatMarker.mmsi));

	if (oldSelectedVesselMmsi) {
		updateSingleVesselUI(targets.get(oldSelectedVesselMmsi));
	}
}
