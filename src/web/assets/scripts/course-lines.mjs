/**
 * Implements the course lines responsibilities of the AJRM Marine Display browser application.
 */

import { projectedLocation } from "./map-geometry.mjs";

export function setSelectedCourseLine({
	line,
	start,
	cog,
	distance,
	cpaMarker,
	map,
}) {
	if (!finiteNumber(cog) || !finiteNumber(distance) || distance < 0) {
		clearCourseLine(line);
		cpaMarker?.removeFrom?.(map);
		return false;
	}
	const projectedCpaLocation = projectedLocation(start, cog, distance);
	const state = {
		kind: "selected",
		start,
		end: projectedCpaLocation,
		color: "blue",
		opacity: 1.0,
		dashArray: "",
	};
	if (!sameCourseLineState(line._ajrmMarineCourseLineState, state)) {
		line.setLatLngs([start, projectedCpaLocation]);
		line.setStyle({
			color: "blue",
			opacity: 1.0,
			interactive: false,
			dashArray: "",
			className: "blueStuff",
		});
		line._ajrmMarineCourseLineState = state;
	}

	setMarkerLatLngIfChanged(cpaMarker, projectedCpaLocation);
	if (!map.hasLayer(cpaMarker)) cpaMarker.addTo(map);
	return true;
}

export function setProjectedCourseLine({
	line,
	start,
	cog,
	distance,
	color,
}) {
	if (!finiteNumber(cog) || !finiteNumber(distance) || distance <= 0) {
		clearCourseLine(line);
		return false;
	}
	const end = projectedLocation(start, cog, distance);
	const state = {
		kind: "projected",
		start,
		end,
		color,
		opacity: 0.7,
		dashArray: "20 10",
	};
	if (sameCourseLineState(line._ajrmMarineCourseLineState, state)) return false;
	line.setLatLngs([start, end]);
	line.setStyle({
		color,
		opacity: 0.7,
		interactive: false,
		dashArray: "20 10",
	});
	line._ajrmMarineCourseLineState = state;
	return true;
}

export function clearCourseLine(line) {
	if (line?._ajrmMarineCourseLineState == null) return;
	line.setLatLngs([]);
	line._ajrmMarineCourseLineState = null;
}

function setMarkerLatLngIfChanged(marker, latLng) {
	if (sameLatLng(marker._ajrmMarineLatLng, latLng)) return;
	marker.setLatLng(latLng);
	marker._ajrmMarineLatLng = latLng;
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

function finiteNumber(value) {
	return (
		value !== null &&
		value !== undefined &&
		value !== "" &&
		Number.isFinite(Number(value))
	);
}
