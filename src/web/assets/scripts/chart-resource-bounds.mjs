import { chartBoundsCandidates } from "./chart-resource-bounds-candidates.mjs";

export { chartBoundsSource, rawBoundsValues } from "./chart-resource-bounds-values.mjs";
export {
	chartBoundsCandidates,
	validChartBounds,
} from "./chart-resource-bounds-candidates.mjs";

export function chartBounds(chart, lat, lon) {
	const candidates = chartBoundsCandidates(chart);
	return lat != null && lon != null
		? candidates.find(
				(bounds) =>
					lon >= bounds[0] &&
					lon <= bounds[2] &&
					lat >= bounds[1] &&
					lat <= bounds[3],
			) ||
				candidates[0] ||
				null
		: candidates[0] || null;
}
