export const DEFAULT_ROUTE_STYLE = Object.freeze({
	color: "#ff7a00",
	weight: 4,
});

export function normalizeRouteStyle(value = {}) {
	const color = /^#[0-9a-f]{6}$/i.test(String(value.color || ""))
		? String(value.color).toLowerCase()
		: DEFAULT_ROUTE_STYLE.color;
	const numericWeight = Number(value.weight);
	return {
		color,
		weight: Number.isFinite(numericWeight)
			? Math.min(12, Math.max(2, Math.round(numericWeight)))
			: DEFAULT_ROUTE_STYLE.weight,
	};
}

export function routeLatLngs(active) {
	const coordinates = active?.resource?.feature?.geometry?.coordinates;
	if (!Array.isArray(coordinates)) return [];
	return coordinates
		.filter(
			(point) =>
				Array.isArray(point) &&
				Number.isFinite(Number(point[0])) &&
				Number.isFinite(Number(point[1])),
		)
		.map(([longitude, latitude]) => [Number(latitude), Number(longitude)]);
}

export function routeArrowSegments(latLngs, maximumArrows = 20) {
	if (!Array.isArray(latLngs) || latLngs.length < 2) return [];
	const stride = Math.max(1, Math.ceil((latLngs.length - 1) / maximumArrows));
	const arrows = [];
	for (let index = 1; index < latLngs.length; index += stride) {
		const from = latLngs[index - 1];
		const to = latLngs[index];
		const bearing = bearingDegrees(from, to);
		arrows.push({
			position: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2],
			bearing,
			rotation: routeArrowGlyphRotation(bearing),
		});
	}
	return arrows;
}

// The right-pointing arrow glyph starts at screen-east, whereas a compass
// bearing starts at north. Subtract a quarter turn before applying CSS rotate.
export function routeArrowGlyphRotation(bearing) {
	return Number(bearing) - 90;
}

export function bearingDegrees([lat1, lon1], [lat2, lon2]) {
	const radians = Math.PI / 180;
	const phi1 = lat1 * radians;
	const phi2 = lat2 * radians;
	const deltaLambda = (lon2 - lon1) * radians;
	const y = Math.sin(deltaLambda) * Math.cos(phi2);
	const x =
		Math.cos(phi1) * Math.sin(phi2) -
		Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
	return (Math.atan2(y, x) / radians + 360) % 360;
}

export function activeRouteFingerprint(active) {
	if (!active) return "none";
	return [
		active.resourceId || "draft",
		active.revision || 0,
		active.reversed === true ? "reverse" : "forward",
		active.changedAt || active.openedAt || "",
	].join(":");
}

export function routeSummary(active) {
	if (!active) return { title: "No route open", details: "" };
	const points = active.resource?.feature?.geometry?.coordinates?.length || 0;
	const meters = Number(active.resource?.distance);
	const distance = Number.isFinite(meters)
		? `${(meters / 1852).toFixed(1)} NM`
		: "distance unavailable";
	return {
		title: active.resource?.name || "Unnamed route",
		details: `${points} points · ${distance} · ${active.reversed ? "reversed" : "forward"}`,
	};
}
