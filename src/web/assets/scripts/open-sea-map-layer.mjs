import {
	CHART_TILE_MAX_ZOOM,
	SEAMARK_LAYER_Z_INDEX,
} from "./chart-layer-constants.mjs";

export const OPEN_SEA_MAP_TILE_URL =
	"https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png";
export const OPEN_SEA_MAP_MAX_NATIVE_ZOOM = 19;

export function openSeaMapLayerOptions() {
	return {
		maxNativeZoom: OPEN_SEA_MAP_MAX_NATIVE_ZOOM,
		maxZoom: CHART_TILE_MAX_ZOOM,
		zIndex: SEAMARK_LAYER_Z_INDEX,
		attribution: "",
	};
}

export function createOpenSeaMapLayer({ L }) {
	return L.tileLayer(OPEN_SEA_MAP_TILE_URL, openSeaMapLayerOptions());
}
