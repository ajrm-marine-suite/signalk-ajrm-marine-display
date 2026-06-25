import {
	createMvtChartLayer,
	isMvtChart,
} from "./chart-mvt-layer-factory.mjs";
import { createRasterChartLayer } from "./chart-raster-layer-factory.mjs";
import { chartUrl, chartZoom } from "./chart-resource-utils.mjs";
import { isLeafletLayer } from "./chart-leaflet-layer-validation.mjs";

export {
	REQUIRED_LEAFLET_LAYER_METHODS,
	isLeafletLayer,
} from "./chart-leaflet-layer-validation.mjs";

export function createChartLeafletLayer({
	L,
	protomapsL,
	chart,
	paintRules,
	labelRules,
	warn = console.warn,
}) {
	const url = chartUrl(chart);
	const zoom = chartZoom(chart);
	if (!url) return null;
	try {
		const layer = isMvtChart(chart)
			? createMvtChartLayer({
					protomapsL,
					url,
					chart,
					paintRules,
					labelRules,
				})
			: createRasterChartLayer({ L, url, zoom });
		return isLeafletLayer(layer) ? layer : null;
	} catch (error) {
		warn("[AJRM Marine charts] failed creating chart layer", {
			id: chart.__autoChartId,
			name: chart.name,
			url,
			error: error?.message || error,
		});
		return null;
	}
}
