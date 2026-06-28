import {
	applySnapshotToTarget,
	createTarget,
	vesselTargetId,
} from "../../../shared/target-model.mjs";

export function ingestRawVesselData({
	vessels,
	targets,
	targetMaxAge,
	removeMissing = false,
}) {
	const freshMmsis = new Set();
	const removedMmsis = [];

	for (const vesselId in vessels) {
		const vessel = vessels[vesselId];
		const targetId = vesselTargetId(vessel, vesselId);
		const target = applySnapshotToTarget(
			targets.get(targetId) ?? createTarget(targetId),
			vessel,
			vesselId,
		);

		const lastSeen = Math.round((Date.now() - target.lastSeenDate) / 1000);
		if (lastSeen >= targetMaxAge) continue;

		freshMmsis.add(target.mmsi);
		targets.set(target.mmsi, target);
	}

	if (removeMissing) {
		for (const mmsi of targets.keys()) {
			if (!freshMmsis.has(mmsi)) {
				targets.delete(mmsi);
				removedMmsis.push(mmsi);
			}
		}
	}

	return { removedMmsis };
}
