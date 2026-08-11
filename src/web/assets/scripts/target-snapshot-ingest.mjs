/**
 * Implements the target snapshot ingest responsibilities of the AJRM Marine Display browser application.
 */

import {
	applySnapshotToTarget,
	createTarget,
	vesselTargetId,
} from "../../../shared/target-model.mjs";

const LAST_SELF_FIX_STORAGE_KEY = "ajrmMarineDisplay.lastSelfFix.v1";

export function ingestRawVesselData({
	vessels,
	targets,
	targetMaxAge,
	selfMmsi = null,
	removeMissing = false,
	lastFixStorage = globalThis.localStorage,
	storedSelfFixEnabled = true,
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
		const retainedSelf = hasPosition(previous)
			? previous
			: storedSelfFixEnabled
				? readStoredSelfFix(lastFixStorage, selfMmsi)
				: null;
		if (targetId === selfMmsi && !hasPosition(target) && hasPosition(retainedSelf)) {
			target = staleSelfTarget({
				...target,
				latitude: retainedSelf.latitude,
				longitude: retainedSelf.longitude,
				lastSeenDate: retainedSelf.lastSeenDate,
				lastKnownCog: retainedSelf.lastKnownCog,
				lastKnownHdg: retainedSelf.lastKnownHdg,
			});
			targets.set(targetId, target);
			freshMmsis.add(targetId);
			continue;
		}

		const lastSeen = Math.round((Date.now() - target.lastSeenDate) / 1000);
		if (lastSeen >= targetMaxAge) {
			const lastKnownSelf = hasPosition(previous) ? previous : target;
			if (targetId === selfMmsi && hasPosition(lastKnownSelf)) {
				if (storedSelfFixEnabled) {
					writeStoredSelfFix(lastFixStorage, selfMmsi, lastKnownSelf);
				}
				targets.set(targetId, staleSelfTarget(lastKnownSelf));
				freshMmsis.add(targetId);
			}
			continue;
		}

		freshMmsis.add(target.mmsi);
		if (target.mmsi === selfMmsi) {
			rememberSelfDirection(target, previous);
			if (storedSelfFixEnabled && hasPosition(target)) {
				writeStoredSelfFix(lastFixStorage, selfMmsi, target);
			}
		}
		targets.set(target.mmsi, target);
	}
	if (selfMmsi && !freshMmsis.has(selfMmsi)) {
		const currentSelf = targets.get(selfMmsi);
		const retainedSelf = hasPosition(currentSelf)
			? currentSelf
			: storedSelfFixEnabled
				? readStoredSelfFix(lastFixStorage, selfMmsi)
				: null;
		if (hasPosition(retainedSelf)) {
			targets.set(
				selfMmsi,
				staleSelfTarget({
					...createTarget(selfMmsi),
					name: "Own vessel",
					...retainedSelf,
				}),
			);
			freshMmsis.add(selfMmsi);
		}
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

function readStoredSelfFix(storage, selfMmsi) {
	if (!storage || !selfMmsi) return null;
	try {
		const parsed = JSON.parse(storage.getItem(LAST_SELF_FIX_STORAGE_KEY));
		if (
			parsed?.schemaVersion !== 1 ||
			parsed?.mmsi !== String(selfMmsi) ||
			!validLatitude(parsed.latitude) ||
			!validLongitude(parsed.longitude)
		) {
			return null;
		}
		const lastSeenDate = new Date(parsed.lastSeenAt);
		if (!Number.isFinite(lastSeenDate.getTime())) return null;
		return {
			latitude: parsed.latitude,
			longitude: parsed.longitude,
			lastSeenDate,
			lastKnownCog: finiteOrUndefined(parsed.lastKnownCog),
			lastKnownHdg: finiteOrUndefined(parsed.lastKnownHdg),
		};
	} catch {
		return null;
	}
}

function writeStoredSelfFix(storage, selfMmsi, target) {
	if (
		!storage ||
		!selfMmsi ||
		!validLatitude(target?.latitude) ||
		!validLongitude(target?.longitude)
	) {
		return;
	}
	const lastSeenAt = target.lastSeenDate?.toISOString?.();
	if (!lastSeenAt) return;
	try {
		storage.setItem(
			LAST_SELF_FIX_STORAGE_KEY,
			JSON.stringify({
				schemaVersion: 1,
				mmsi: String(selfMmsi),
				latitude: target.latitude,
				longitude: target.longitude,
				lastSeenAt,
				lastKnownCog: finiteOrNull(target.lastKnownCog ?? target.cog),
				lastKnownHdg: finiteOrNull(target.lastKnownHdg ?? target.hdg),
			}),
		);
	} catch {
		// Display continues with its in-memory cache when browser storage is unavailable.
	}
}

function validLatitude(value) {
	return Number.isFinite(value) && value >= -90 && value <= 90;
}

function validLongitude(value) {
	return Number.isFinite(value) && value >= -180 && value <= 180;
}

function finiteOrNull(value) {
	return Number.isFinite(value) ? value : null;
}

function finiteOrUndefined(value) {
	return Number.isFinite(value) ? value : undefined;
}
