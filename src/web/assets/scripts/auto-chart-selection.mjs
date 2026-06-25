import { chooseBestChart } from "./chart-resource-utils.mjs";

export function createAutoChartList(charts) {
	return Object.entries(charts || {}).map(([key, chart]) => ({
		...chart,
		__autoChartId: key,
	}));
}

export function chooseAutoChartForMap({ chartList, map, getPosition }) {
	const zoom = map.getZoom();
	const position = getPosition();
	return chooseBestChart(chartList, {
		lat: position.lat,
		lng: position.lng,
		zoom,
		maxZoom: map.getMaxZoom(),
	});
}
