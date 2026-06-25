import { SETTINGS_STORAGE_KEYS } from "./settings-storage-keys.mjs";

export function startupBaseLayer({ baseMaps, baseLayerName }) {
	return baseMaps[baseLayerName];
}

export function persistAndAddBaseLayer({ storage, baseMaps, baseLayerName, map }) {
	storage.setItem(SETTINGS_STORAGE_KEYS.baseLayer, baseLayerName);
	startupBaseLayer({ baseMaps, baseLayerName }).addTo(map);
}

export function startupOverlayLayer({ overlayMaps, overlayName }) {
	return overlayName ? overlayMaps[overlayName] : null;
}

export function addStartupOverlay({ overlayMaps, overlayName, map }) {
	startupOverlayLayer({ overlayMaps, overlayName })?.addTo(map);
}

export function refreshStartupUi({ chartLayerController, displaySettings }) {
	chartLayerController.updateChartSelectorControl();
	displaySettings.init();
}
