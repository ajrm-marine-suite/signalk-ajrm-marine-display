/**
 * Implements the target snapshot ingest responsibilities of the AJRM Marine Display browser application.
 */

import {
	applySnapshotToTarget,
	createTarget,
	vesselTargetId,
} from "../../../shared/target-model.mjs";

export function ingestRawVesselData({
	vessels,
	targets,
	targetMaxAge,
	selfMmsi = null,
	removeMissing = false,
}) {
	const freshMmsis = new Set();
	const removedMmsis = [];

	for (const vesselId in vessels) {
		const vessel = vessels[vesselId];
		const targetId = vesselTargetId(vessel, vesselId);
		const previous = targets.get(targetId);
		let target = applySnapshotToTarget(
			previous ? { ...previous } : createTarget(targetId),
			vessel,
			vesselId,
		);
		if (targetId === selfMmsi && !hasPosition(target) && hasPosition(previous)) {
			target = staleSelfTarget({
				...target,
				latitude: previous.latitude,
				longitude: previous.longitude,
				lastSeenDate: previous.lastSeenDate,
				lastKnownCog: previous.lastKnownCog,
				lastKnownHdg: previous.lastKnownHdg,
			});
			targets.set(targetId, target);
			freshMmsis.add(targetId);
			continue;
		}

		const lastSeen = Math.round((Date.now() - target.lastSeenDate) / 1000);
		if (lastSeen >= targetMaxAge) {
			const lastKnownSelf = hasPosition(previous) ? previous : target;
			if (targetId === selfMmsi && hasPosition(lastKnownSelf)) {
				targets.set(targetId, staleSelfTarget(lastKnownSelf));
				freshMmsis.add(targetId);
			}
			continue;
		}

		freshMmsis.add(target.mmsi);
		if (target.mmsi === selfMmsi) rememberSelfDirection(target, previous);
		targets.set(target.mmsi, target);
	}
	if (
		selfMmsi &&
		!freshMmsis.has(selfMmsi) &&
		hasPosition(targets.get(selfMmsi))
	) {
		targets.set(selfMmsi, staleSelfTarget(targets.get(selfMmsi)));
		freshMmsis.add(selfMmsi);
	}

	if (removeMissing) {
		for (const mmsi of targets.keys()) {
			if (!freshMmsis.has(mmsi)) {
				if (mmsi === selfMmsi && hasPosition(targets.get(mmsi))) {
					targets.set(mmsi, staleSelfTarget(targets.get(mmsi)));
					continue;
				}
				targets.delete(mmsi);
				removedMmsis.push(mmsi);
			}
		}
	}

	return { removedMmsis };
}

function rememberSelfDirection(target, previous) {
	target.lastKnownHdg = Number.isFinite(target.hdg)
		? target.hdg
		: previous?.lastKnownHdg;
	target.lastKnownCog = Number.isFinite(target.cog)
		? target.cog
		: previous?.lastKnownCog;
	target.isStale = false;
	target.isLost = false;
}

function staleSelfTarget(target) {
	return {
		...target,
		lastKnownHdg: Number.isFinite(target.lastKnownHdg)
			? target.lastKnownHdg
			: target.hdg,
		lastKnownCog: Number.isFinite(target.lastKnownCog)
			? target.lastKnownCog
			: target.cog,
		sog: undefined,
		cog: undefined,
		hdg: undefined,
		rot: undefined,
		isStale: true,
		isLost: true,
	};
}

function hasPosition(target) {
	return Number.isFinite(target?.latitude) && Number.isFinite(target?.longitude);
}
