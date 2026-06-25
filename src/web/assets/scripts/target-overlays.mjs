import * as L from "leaflet";
import {
	createCpaLimitRingSet,
	removeCpaLimitRingSet,
	updateCpaLimitRing,
} from "./target-overlay-cpa-rings.mjs";
import {
	createSilenceBadgeMarker,
	removeSilenceBadgeMarker,
	updateSilenceBadgeMarker,
} from "./target-overlay-silence-badge.mjs";
import { targetSilenceBadgeState } from "./target-overlay-silence-state.mjs";
import { targetCpaRingProfile } from "./target-overlay-cpa-profile.mjs";
import { shouldShowTargetOverlay } from "./target-overlay-state.mjs";
import { getOrCreateStoredOverlay } from "./target-overlay-store.mjs";

export function createTargetOverlayController({
	map,
	getSelfMmsi,
	getCollisionProfiles,
	setCollisionProfiles,
	normalizeCollisionProfiles,
	vesselSizeCategory,
	criteriaForSize,
	metersPerNm,
	leaflet = L,
}) {
	const silenceBadgeMarkers = new Map();
	const silenceBadgeSignatures = new Map();
	const cpaLimitRings = new Map();

	function updateSilenceBadge(target) {
		const state = targetSilenceBadgeState({
			target,
			selfMmsi: getSelfMmsi(),
		});
		const signature = silenceBadgeSignature(state);
		if (silenceBadgeSignatures.get(state.mmsi) === signature) return;
		if (state.show) {
			const marker = getOrCreateStoredOverlay({
				store: silenceBadgeMarkers,
				key: target.mmsi,
				create: () => createSilenceBadgeMarker({ ...target, leaflet }).addTo(map),
			});
			updateSilenceBadgeMarker({
				map,
				marker,
				latitude: state.latitude,
				longitude: state.longitude,
			});
		} else {
			removeSilenceBadge(state.mmsi);
		}
		silenceBadgeSignatures.set(state.mmsi, signature);
	}

	function removeSilenceBadge(mmsi) {
		silenceBadgeSignatures.delete(mmsi);
		const marker = silenceBadgeMarkers.get(mmsi);
		if (!marker) return;
		removeSilenceBadgeMarker({ map, marker });
		silenceBadgeMarkers.delete(mmsi);
	}

	function removeCpaLimitRings(mmsi) {
		const rings = cpaLimitRings.get(mmsi);
		if (!rings) return;
		removeCpaLimitRingSet({ map, rings });
		cpaLimitRings.delete(mmsi);
	}

	function updateCpaLimitRings(target, collisionProfiles = getCollisionProfiles()) {
		if (!shouldShowTargetOverlay({ target, selfMmsi: getSelfMmsi() })) {
			removeCpaLimitRings(target?.mmsi);
			return;
		}

		const { normalizedProfiles, warning, danger, cpaSensitivity } =
			targetCpaRingProfile({
				target,
				collisionProfiles,
				normalizeCollisionProfiles,
				vesselSizeCategory,
				criteriaForSize,
			});
		setCollisionProfiles(normalizedProfiles);

		const rings = getOrCreateStoredOverlay({
			store: cpaLimitRings,
			key: target.mmsi,
			create: () => createCpaLimitRingSet({ ...target, leaflet: L }),
		});

		const latLng = [target.latitude, target.longitude];
		updateCpaLimitRing({
			map,
			ring: rings.warning,
			criteria: warning,
			cpaSensitivity,
			latLng,
			metersPerNm,
		});
		updateCpaLimitRing({
			map,
			ring: rings.danger,
			criteria: danger,
			cpaSensitivity,
			latLng,
			metersPerNm,
		});
	}

	return {
		removeCpaLimitRings,
		removeSilenceBadge,
		updateCpaLimitRings,
		updateSilenceBadge,
	};
}

function silenceBadgeSignature(state) {
	if (!state?.show) return `hidden|${state?.mmsi || ""}`;
	return [
		"shown",
		state.mmsi || "",
		state.latitude,
		state.longitude,
	].join("|");
}
