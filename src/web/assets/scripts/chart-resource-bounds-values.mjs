export const CHART_BOUNDS_SOURCE_GETTERS = [
	(chart) => chart?.bounds,
	(chart) => chart?.boundingBox,
	(chart) => chart?.extent,
	(chart) => chart?.bbox,
	(chart) => chart?.properties?.bounds,
	(chart) => chart?.properties?.bbox,
	(chart) => chart?.metadata?.bounds,
];

export function chartBoundsSource(chart) {
	return CHART_BOUNDS_SOURCE_GETTERS.find((getter) => getter(chart))?.(chart);
}

export function objectBoundsValues(source) {
	if (source.sw && source.ne) {
		return [
			source.sw.lng ?? source.sw.lon ?? source.sw[1],
			source.sw.lat ?? source.sw[0],
			source.ne.lng ?? source.ne.lon ?? source.ne[1],
			source.ne.lat ?? source.ne[0],
		].map(Number);
	}
	return [
		source.minLon ??
			source.west ??
			source.left ??
			source.minx ??
			source.xmin ??
			source.longitudeMin ??
			source.minLongitude,
		source.minLat ??
			source.south ??
			source.bottom ??
			source.miny ??
			source.ymin ??
			source.latitudeMin ??
			source.minLatitude,
		source.maxLon ??
			source.east ??
			source.right ??
			source.maxx ??
			source.xmax ??
			source.longitudeMax ??
			source.maxLongitude,
		source.maxLat ??
			source.north ??
			source.top ??
			source.maxy ??
			source.ymax ??
			source.latitudeMax ??
			source.maxLatitude,
	].map(Number);
}

export function rawBoundsValues(source) {
	if (Array.isArray(source)) return source.slice(0, 4).map(Number);
	if (typeof source === "string") {
		return source
			.split(/[\s,]+/)
			.map(Number)
			.filter(Number.isFinite)
			.slice(0, 4);
	}
	if (source && typeof source === "object") return objectBoundsValues(source);
	return null;
}
