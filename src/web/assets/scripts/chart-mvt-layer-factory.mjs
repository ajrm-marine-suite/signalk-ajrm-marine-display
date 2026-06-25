import { CHART_LAYER_Z_INDEX } from "./chart-layer-constants.mjs";

export function isMvtChart(chart) {
	return chart.format === "mvt" || chart.type === "mvt";
}

export function mvtChartLayerOptions({ url, chart, paintRules, labelRules }) {
	return {
		url,
		maxDataZoom: chart.maxzoom ?? chart.maxZoom,
		paintRules,
		labelRules,
		zIndex: CHART_LAYER_Z_INDEX,
	};
}

export function createMvtChartLayer({
	protomapsL,
	url,
	chart,
	paintRules,
	labelRules,
}) {
	return protomapsL.leafletLayer(
		mvtChartLayerOptions({
			url,
			chart,
			paintRules,
			labelRules,
		}),
	);
}
