export function ageOutTargets({
	targets,
	selfMmsi,
	selectedVesselMmsi,
	targetMaxAge,
	boatMarkers,
	boatProjectedCourseLines,
	targetOverlays,
	removeCpaLimitRings,
	labelCollision,
	onSelectedTargetAgedOut,
}) {
	let removed = 0;
	targets.forEach((target, mmsi) => {
		if (mmsi === selfMmsi || target.lastSeen <= targetMaxAge) return;

		if (mmsi === selectedVesselMmsi) {
			removeCpaLimitRings(mmsi);
			onSelectedTargetAgedOut();
		}

		removeTargetArtifacts({
			mmsi,
			boatMarkers,
			boatProjectedCourseLines,
			targetOverlays,
			removeCpaLimitRings,
			labelCollision,
		});
		targets.delete(mmsi);
		removed++;
	});
	return removed;
}

export function removeTargetArtifacts({
	mmsi,
	boatMarkers,
	boatProjectedCourseLines,
	targetOverlays,
	removeCpaLimitRings,
	labelCollision,
}) {
	removeMappedLayer(boatMarkers, mmsi);
	removeMappedLayer(boatProjectedCourseLines, mmsi);
	targetOverlays.removeSilenceBadge(mmsi);
	removeCpaLimitRings(mmsi);
	labelCollision.remove(mmsi);
}

export function removeMappedLayer(layerMap, id) {
	const layer = layerMap.get(id);
	if (!layer) return;
	layer.footprintPolygon?.remove?.();
	layer.remove();
	layerMap.delete(id);
}
