import { chartBounds } from "./chart-resource-bounds.mjs";
import { chartZoom } from "./chart-resource-url.mjs";

export const CHART_ZOOM_TOLERANCE = 0.1;

export function pointInChartBounds(bounds, lat, lon) {
	return (
		!!bounds &&
		lon >= bounds[0] &&
		lon <= bounds[2] &&
		lat >= bounds[1] &&
		lat <= bounds[3]
	);
}

export function chartContains(chart, lat, lon) {
	const bounds = chartBounds(chart, lat, lon);
	return pointInChartBounds(bounds, lat, lon);
}

export function chartArea(chart, lat, lon) {
	const bounds = chartBounds(chart, lat, lon);
	return bounds
		? Math.abs((bounds[2] - bounds[0]) * (bounds[3] - bounds[1]))
		: Number.MAX_VALUE;
}

export function chartZoomMatches(chart, { zoom, maxZoom }) {
	const candidateZoom = chartZoom(chart);
	return (
		zoom >= candidateZoom.min - CHART_ZOOM_TOLERANCE &&
		zoom <= maxZoom + CHART_ZOOM_TOLERANCE
	);
}

export function compareChartCandidates({ lat, lng, zoom }) {
	return (a, b) => {
		const aZoom = chartZoom(a);
		const bZoom = chartZoom(b);
		const aHasNativeZoom = aZoom.max >= zoom;
		const bHasNativeZoom = bZoom.max >= zoom;
		if (aHasNativeZoom !== bHasNativeZoom) return aHasNativeZoom ? -1 : 1;
		const nativeZoomOrder = aHasNativeZoom
			? aZoom.max - bZoom.max
			: bZoom.max - aZoom.max;
		return (
			nativeZoomOrder ||
			chartArea(a, lat, lng) - chartArea(b, lat, lng) ||
			bZoom.min - aZoom.min
		);
	};
}

export function chooseBestChart(chartList, { lat, lng, zoom, maxZoom }) {
	const containing = chartList.filter((candidate) =>
		chartContains(candidate, lat, lng),
	);
	const zoomMatches = containing.filter((candidate) =>
		chartZoomMatches(candidate, { zoom, maxZoom }),
	);
	return zoomMatches.sort(compareChartCandidates({ lat, lng, zoom }))[0] || null;
}
