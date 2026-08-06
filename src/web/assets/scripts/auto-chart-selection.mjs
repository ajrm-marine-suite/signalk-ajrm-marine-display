import { chartCandidates } from "./chart-resource-utils.mjs";

export function createAutoChartList(charts) {
	return Object.entries(charts || {}).map(([key, chart]) => ({
		...chart,
		__autoChartId: key,
	}));
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
