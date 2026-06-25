import { projectedLocation } from "./map-geometry.mjs";

export function setSelectedCourseLine({
	line,
	start,
	cog,
	distance,
	cpaMarker,
	map,
}) {
	const projectedCpaLocation = projectedLocation(start, cog || 0, distance || 0);
	const state = {
		kind: "selected",
		start,
		end: projectedCpaLocation,
		color: "blue",
		opacity: 1.0,
		dashArray: "",
	};
	if (!sameCourseLineState(line._aisPlusCourseLineState, state)) {
		line.setLatLngs([start, projectedCpaLocation]);
		line.setStyle({
			color: "blue",
			opacity: 1.0,
			interactive: false,
			dashArray: "",
			className: "blueStuff",
		});
		line._aisPlusCourseLineState = state;
	}

	setMarkerLatLngIfChanged(cpaMarker, projectedCpaLocation);
	if (!map.hasLayer(cpaMarker)) cpaMarker.addTo(map);
}

export function setProjectedCourseLine({
	line,
	start,
	cog,
	distance,
	color,
}) {
	if ((distance || 0) <= 0) {
		clearCourseLine(line);
		return;
	}
	const end = projectedLocation(start, cog || 0, distance || 0);
	const state = {
		kind: "projected",
		start,
		end,
		color,
		opacity: 0.7,
		dashArray: "20 10",
	};
	if (sameCourseLineState(line._aisPlusCourseLineState, state)) return;
	line.setLatLngs([start, end]);
	line.setStyle({
		color,
		opacity: 0.7,
		interactive: false,
		dashArray: "20 10",
	});
	line._aisPlusCourseLineState = state;
}

export function clearCourseLine(line) {
	if (line?._aisPlusCourseLineState == null) return;
	line.setLatLngs([]);
	line._aisPlusCourseLineState = null;
}

function setMarkerLatLngIfChanged(marker, latLng) {
	if (sameLatLng(marker._aisPlusLatLng, latLng)) return;
	marker.setLatLng(latLng);
	marker._aisPlusLatLng = latLng;
}

function sameCourseLineState(previous, next) {
	return (
		previous?.kind === next.kind &&
		previous?.color === next.color &&
		previous?.opacity === next.opacity &&
		previous?.dashArray === next.dashArray &&
		sameLatLng(previous?.start, next.start) &&
		sameLatLng(previous?.end, next.end)
	);
}

function sameLatLng(previous, next) {
	return previous?.[0] === next?.[0] && previous?.[1] === next?.[1];
}
