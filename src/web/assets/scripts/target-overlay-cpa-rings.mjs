import { cpaLimitRingRadiusMeters } from "./target-overlay-state.mjs";

export function createCpaLimitRingSet({
	latitude,
	longitude,
	leaflet,
}) {
	if (!leaflet?.circle) {
		throw new Error("Leaflet circle factory is required for CPA rings");
	}
	const latLng = [latitude, longitude];
	return {
		warning: leaflet.circle(latLng, {
			radius: 1,
			color: "orange",
			weight: 2,
			opacity: 0.75,
			fill: false,
			interactive: false,
			dashArray: "8 8",
			className: "aisPlusCpaWarningRing",
		}),
		danger: leaflet.circle(latLng, {
			radius: 1,
			color: "red",
			weight: 2,
			opacity: 0.85,
			fill: false,
			interactive: false,
			className: "aisPlusCpaDangerRing",
		}),
	};
}

export function removeCpaLimitRingSet({ map, rings }) {
	if (!rings) return;
	rings.warning?.removeFrom(map);
	rings.danger?.removeFrom(map);
}

export function updateCpaLimitRing({
	map,
	ring,
	criteria,
	cpaSensitivity,
	latLng,
	metersPerNm,
	radiusForCriteria = cpaLimitRingRadiusMeters,
}) {
	const radius = radiusForCriteria({
		criteria,
		cpaSensitivity,
		metersPerNm,
	});
	const hasLayer = map.hasLayer(ring);
	if (radius > 0) {
		if (!sameRingState(ring._aisPlusCpaRingState, { latLng, radius })) {
			ring.setLatLng(latLng);
			ring.setRadius(radius);
			ring._aisPlusCpaRingState = { latLng, radius };
		}
		if (!hasLayer) ring.addTo(map);
	} else if (hasLayer) {
		ring.removeFrom(map);
		ring._aisPlusCpaRingState = { latLng, radius };
	}
	return radius;
}

function sameRingState(previous, next) {
	return (
		previous?.radius === next.radius &&
		previous?.latLng?.[0] === next.latLng?.[0] &&
		previous?.latLng?.[1] === next.latLng?.[1]
	);
}
