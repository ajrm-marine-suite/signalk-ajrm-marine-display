import {
	CHART_LAYER_Z_INDEX,
	SEAMARK_LAYER_Z_INDEX,
} from "./chart-layer-constants.mjs";
import { isLeafletLayer } from "./chart-leaflet-layer-factory.mjs";

export function keepChartLayersOnTop({ group, map, openSeaMap }) {
	group.eachLayer((layer) => {
		if (isLeafletLayer(layer)) {
			layer.setZIndex?.(CHART_LAYER_Z_INDEX);
			layer.bringToFront?.();
		}
	});
	if (openSeaMap && map.hasLayer(openSeaMap)) {
		openSeaMap.setZIndex?.(SEAMARK_LAYER_Z_INDEX);
		openSeaMap.bringToFront?.();
	}
}
