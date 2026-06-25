export const CHART_URL_FIELDS = ["tilemapUrl", "url", "tileUrl", "href"];

export function chartUrl(chart) {
	return CHART_URL_FIELDS.map((field) => chart?.[field]).find(Boolean) || "";
}

export function numericChartZoom(value, fallback) {
	const zoom = Number(value ?? fallback);
	return Number.isFinite(zoom) ? zoom : fallback;
}

export function chartZoom(chart) {
	return {
		min: numericChartZoom(chart?.minzoom ?? chart?.minZoom, 0),
		max: numericChartZoom(chart?.maxzoom ?? chart?.maxZoom, 24),
	};
}
