import {
	AUTO_CHARTS_OVERLAY_NAME,
	HARBOUR_LIMITS_OVERLAY_NAME,
	OPEN_SEA_MAP_OVERLAY_NAME,
} from "./chart-layer-overlay-actions.mjs";

export function createOverlayMaps({ openSeaMap, autoCharts, harbourDisplay }) {
	const overlayMaps = {
		[OPEN_SEA_MAP_OVERLAY_NAME]: openSeaMap,
		[AUTO_CHARTS_OVERLAY_NAME]: autoCharts.group,
	};
	if (harbourDisplay?.layer) {
		overlayMaps[HARBOUR_LIMITS_OVERLAY_NAME] = harbourDisplay.layer;
	}
	return overlayMaps;
}
