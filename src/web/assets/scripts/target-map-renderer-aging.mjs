import { ageOutTargets, removeTargetArtifacts } from "./target-aging.mjs";
import { createSelectedTargetAgedOutHandler } from "./target-map-renderer-actions.mjs";

export function ageOutRendererTargets({
	targets,
	selfMmsi,
	selectedVesselMmsi,
	targetMaxAge,
	boatMarkers,
	boatProjectedCourseLines,
	targetOverlays,
	labelCollision,
	map,
	selectionMarkers,
	selectedVesselModal,
	setSelectedVesselMmsi,
	ageTargets = ageOutTargets,
	selectedTargetAgedOutHandler = createSelectedTargetAgedOutHandler,
}) {
	return ageTargets({
		targets,
		selfMmsi,
		selectedVesselMmsi,
		targetMaxAge,
		boatMarkers,
		boatProjectedCourseLines,
		targetOverlays,
		removeCpaLimitRings: (mmsi) => targetOverlays.removeCpaLimitRings(mmsi),
		labelCollision,
		onSelectedTargetAgedOut: selectedTargetAgedOutHandler({
			map,
			selectionMarkers,
			selectedVesselModal,
			setSelectedVesselMmsi,
		}),
	});
}

export function removeMissingRendererTargets({
	mmsis,
	selectedVesselMmsi,
	boatMarkers,
	boatProjectedCourseLines,
	targetOverlays,
	labelCollision,
	map,
	selectionMarkers,
	selectedVesselModal,
	setSelectedVesselMmsi,
	selectedTargetAgedOutHandler = createSelectedTargetAgedOutHandler,
}) {
	const onSelectedTargetRemoved = selectedTargetAgedOutHandler({
		map,
		selectionMarkers,
		selectedVesselModal,
		setSelectedVesselMmsi,
	});

	for (const mmsi of mmsis) {
		if (mmsi === selectedVesselMmsi) onSelectedTargetRemoved();
		removeTargetArtifacts({
			mmsi,
			boatMarkers,
			boatProjectedCourseLines,
			targetOverlays,
			removeCpaLimitRings: (targetMmsi) =>
				targetOverlays.removeCpaLimitRings(targetMmsi),
			labelCollision,
		});
	}
}
