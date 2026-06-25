import { NATURAL_EARTH_BASE_MAP_NAME } from "./chart-base-map-definitions.mjs";
import { AUTO_CHARTS_OVERLAY_NAME } from "./chart-layer-overlay-actions.mjs";

export const DEFAULT_BASE_LAYER = NATURAL_EARTH_BASE_MAP_NAME;

export function hasNamedLayer(layers, name) {
	return Boolean(name && Object.hasOwn(layers || {}, name));
}

export function fallbackBaseLayerName({ baseMaps, defaultBaseLayer = DEFAULT_BASE_LAYER }) {
	return hasNamedLayer(baseMaps, defaultBaseLayer)
		? defaultBaseLayer
		: Object.keys(baseMaps || {})[0] || "";
}

export function restoredOverlayName({ overlayMaps, storedOverlay }) {
	return hasNamedLayer(overlayMaps, storedOverlay) &&
		storedOverlay !== AUTO_CHARTS_OVERLAY_NAME
		? storedOverlay
		: "";
}

export function resolveChartStartupState({
	storedBaseLayer,
	storedOverlay,
	storedAutoCharts,
	baseMaps,
	overlayMaps,
	defaultBaseLayer = DEFAULT_BASE_LAYER,
}) {
	let baseLayerName = storedBaseLayer;
	if (!hasNamedLayer(baseMaps, baseLayerName) || baseLayerName === "OpenStreetMap") {
		baseLayerName = fallbackBaseLayerName({ baseMaps, defaultBaseLayer });
	}

	return {
		baseLayerName,
		overlayName: restoredOverlayName({ overlayMaps, storedOverlay }),
		autoChartsEnabled: storedAutoCharts !== "false",
	};
}
