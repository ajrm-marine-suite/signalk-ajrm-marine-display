import { chartCandidates } from "@ajrm-marine/map-core";
import { chartBoundsCandidates } from "./chart-resource-bounds.mjs";
import { chartZoom } from "./chart-resource-url.mjs";

export function createAutoChartList(charts) {
	return Object.entries(charts || {}).map(([key, chart]) => {
		const normalized = { ...chart, __autoChartId: key };
		Object.defineProperties(normalized, {
			__autoChartBoundsCandidates: {
				value: chartBoundsCandidates(chart),
			},
			__autoChartZoom: { value: chartZoom(chart) },
		});
		return normalized;
	});
}

export function chooseAutoChartForMap({ chartList, map, getPosition }) {
	return chartCandidatesForMap({ chartList, map, getPosition })[0] || null;
}

export function chartCandidatesForMap({ chartList, map, getPosition }) {
	const zoom = map.getZoom();
	const position = getPosition();
	return chartCandidates(chartList, {
		lat: position.lat,
		lng: position.lng,
		zoom,
		maxZoom: map.getMaxZoom(),
	});
}
