import {
	AUTO_CHARTS_OVERLAY_NAME,
	HARBOUR_LIMITS_OVERLAY_NAME,
} from "./chart-layer-overlay-actions.mjs";
import { SETTINGS_STORAGE_KEYS } from "./settings-storage-keys.mjs";

export function chartSelectorBaseLayerGetter({ storage }) {
	return () => storage.getItem(SETTINGS_STORAGE_KEYS.baseLayer);
}

export function chartSelectorOverlayEnabledGetter({
	autoCharts,
	harbourDisplay,
	map,
	overlayMaps,
}) {
	return (name) =>
		name === AUTO_CHARTS_OVERLAY_NAME
			? autoCharts.enabled
			: name === HARBOUR_LIMITS_OVERLAY_NAME
				? harbourDisplay?.isEnabled?.() === true
				: map.hasLayer(overlayMaps[name]);
}

export function chartSelectorSetupConfig({
	L,
	map,
	baseMaps,
	overlayMaps,
	autoCharts,
	harbourDisplay,
	chartLayerController,
	escapeHtml,
	storage,
}) {
	return {
		L,
		map,
		baseMaps,
		overlayMaps,
		getBaseLayerName: chartSelectorBaseLayerGetter({ storage }),
		isOverlayEnabled: chartSelectorOverlayEnabledGetter({
			autoCharts,
			harbourDisplay,
			map,
			overlayMaps,
		}),
		onSelectBaseLayer: chartLayerController.selectBaseLayer,
		onSetOverlayLayer: chartLayerController.setOverlayLayer,
		escapeHtml,
	};
}

export function createConfiguredChartSelector({
	L,
	map,
	baseMaps,
	overlayMaps,
	autoCharts,
	harbourDisplay,
	chartLayerController,
	escapeHtml,
	storage = globalThis.localStorage,
	createSelector,
}) {
	return createSelector(chartSelectorSetupConfig({
		L,
		map,
		baseMaps,
		overlayMaps,
		autoCharts,
		harbourDisplay,
		chartLayerController,
		escapeHtml,
		storage,
	}));
}
