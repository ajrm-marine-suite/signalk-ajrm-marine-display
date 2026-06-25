import {
	chartBoundsSource,
	rawBoundsValues,
} from "./chart-resource-bounds-values.mjs";

export function validChartBounds(bounds) {
	return (
		bounds.every(Number.isFinite) &&
		bounds[0] >= -180 &&
		bounds[2] <= 180 &&
		bounds[1] >= -90 &&
		bounds[3] <= 90 &&
		bounds[0] < bounds[2] &&
		bounds[1] < bounds[3]
	);
}

export function chartBoundsKey(bounds) {
	return bounds.join(",");
}

export function uniqueChartBounds(candidates) {
	return candidates.filter(
		(candidate, index, all) =>
			all.findIndex((other) => chartBoundsKey(other) === chartBoundsKey(candidate)) ===
			index,
	);
}

export function pointBoundsCandidates(source) {
	const points = source
		.filter(Array.isArray)
		.map((point) => point.slice(0, 2).map(Number))
		.filter((point) => point.length === 2 && point.every(Number.isFinite));
	if (points.length < 2) return [];

	const xs = points.map((point) => point[0]);
	const ys = points.map((point) => point[1]);
	return [
		[Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
		[Math.min(...ys), Math.min(...xs), Math.max(...ys), Math.max(...xs)],
	];
}

export function rawBoundsCandidates(raw) {
	if (!raw || raw.length < 4) return [];
	const [a, b, c, d] = raw;
	return [
		[Math.min(a, c), Math.min(b, d), Math.max(a, c), Math.max(b, d)],
		[Math.min(b, d), Math.min(a, c), Math.max(b, d), Math.max(a, c)],
	];
}

export function chartBoundsCandidates(chart) {
	const source = chartBoundsSource(chart);
	const candidates =
		Array.isArray(source) && source.some(Array.isArray)
			? pointBoundsCandidates(source)
			: rawBoundsCandidates(rawBoundsValues(source));
	return uniqueChartBounds(candidates.filter(validChartBounds));
}
