import {
	CHART_LAYER_Z_INDEX,
	CHART_TILE_MAX_ZOOM,
	EMPTY_ERROR_TILE,
} from "./chart-layer-constants.mjs";

export function rasterChartLayerOptions(zoom) {
	return {
		maxNativeZoom: zoom.max,
		minNativeZoom: zoom.min,
		maxZoom: CHART_TILE_MAX_ZOOM,
		minZoom: zoom.min,
		zIndex: CHART_LAYER_Z_INDEX,
		attribution: "",
		errorTileUrl: EMPTY_ERROR_TILE,
	};
}

export function createRasterChartLayer({ L, url, zoom }) {
	return L.tileLayer(url, rasterChartLayerOptions(zoom));
}
