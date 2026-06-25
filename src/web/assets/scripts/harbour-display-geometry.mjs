export function harbourDisplayName(name) {
	return String(name || "").replace(/^Harbour:\s*/i, "");
}

export function harbourGeometry(region) {
	const geometry = region?.geometry || region?.feature?.geometry || region?.feature;
	return geometry?.type === "Polygon" || geometry?.type === "MultiPolygon"
		? geometry
		: null;
}

export function harbourPolygons(region) {
	const geometry = harbourGeometry(region);
	if (geometry?.type === "Polygon") return [geometry.coordinates];
	if (geometry?.type === "MultiPolygon") return geometry.coordinates;
	return [];
}

export function harbourLatLngs(polygon) {
	return polygon
		.map((ring) =>
			ring
				.map((point) => [Number(point[1]), Number(point[0])])
				.filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1])),
		)
		.filter((ring) => ring.length >= 3);
}

export function harbourLabelPoint(polygon) {
	const points = (polygon[0] || [])
		.map((point) => ({ lat: Number(point[1]), lon: Number(point[0]) }))
		.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon));
	if (!points.length) return null;
	const south = Math.min(...points.map((point) => point.lat));
	let southernPoints = points.filter((point) => Math.abs(point.lat - south) < 1e-7);
	if (!southernPoints.length) southernPoints = points;
	const lon =
		southernPoints.reduce((sum, point) => sum + point.lon, 0) /
		southernPoints.length;
	return [south, lon];
}

export function harbourPolygonBounds(polygon) {
	const points = (polygon[0] || [])
		.map((point) => ({ lat: Number(point[1]), lon: Number(point[0]) }))
		.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon));
	if (!points.length) return null;
	return {
		west: Math.min(...points.map((point) => point.lon)),
		south: Math.min(...points.map((point) => point.lat)),
		east: Math.max(...points.map((point) => point.lon)),
		north: Math.max(...points.map((point) => point.lat)),
	};
}

export function boundsIntersect(a, b) {
	if (!a || !b) return true;
	return (
		a.west <= b.east &&
		a.east >= b.west &&
		a.south <= b.north &&
		a.north >= b.south
	);
}
