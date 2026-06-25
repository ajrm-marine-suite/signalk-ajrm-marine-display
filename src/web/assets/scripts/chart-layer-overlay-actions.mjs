export const OPEN_SEA_MAP_OVERLAY_NAME = "OpenSeaMap";
export const AUTO_CHARTS_OVERLAY_NAME = "Auto Charts";
export const HARBOUR_LIMITS_OVERLAY_NAME = "Harbour Limits";

export function ensureLayerAdded({ map, layer }) {
	if (!map.hasLayer(layer)) layer.addTo(map);
}

export function ensureLayerRemoved({ map, layer }) {
	if (map.hasLayer(layer)) map.removeLayer(layer);
}

export function isAutoChartsOverlay(name) {
	return name === AUTO_CHARTS_OVERLAY_NAME;
}

export function isOpenSeaMapOverlay(name) {
	return name === OPEN_SEA_MAP_OVERLAY_NAME;
}

export function isHarbourLimitsOverlay(name) {
	return name === HARBOUR_LIMITS_OVERLAY_NAME;
}
