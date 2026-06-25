import {
	isAutoChartsOverlay,
	isHarbourLimitsOverlay,
	isOpenSeaMapOverlay,
	refreshAutoChartsAfterBaseLayerChange,
} from "./chart-layer-actions.mjs";
import { SETTINGS_STORAGE_KEYS } from "./settings-storage-keys.mjs";

export function applyChartLayerDisplayMode(displaySettings) {
	displaySettings.applyColorMode();
}

export function applyBaseLayerChange({
	autoCharts,
	displaySettings,
	storage,
	name,
}) {
	storage.setItem(SETTINGS_STORAGE_KEYS.baseLayer, name);
	refreshAutoChartsAfterBaseLayerChange(autoCharts);
	applyChartLayerDisplayMode(displaySettings);
}

export function applyOverlayAdded({
	autoCharts,
	displaySettings,
	storage,
	harbourDisplay,
	name,
}) {
	if (isAutoChartsOverlay(name)) {
		autoCharts.toggle(true);
	} else if (isHarbourLimitsOverlay(name)) {
		storage.setItem(SETTINGS_STORAGE_KEYS.displayHarbours, "true");
		harbourDisplay?.update({ enabled: true });
	} else {
		storage.setItem(SETTINGS_STORAGE_KEYS.overlayLayer, name);
		if (isOpenSeaMapOverlay(name)) autoCharts.keepOnTop();
	}
	applyChartLayerDisplayMode(displaySettings);
}

export function applyOverlayRemoved({ autoCharts, storage, harbourDisplay, name }) {
	if (isAutoChartsOverlay(name)) {
		autoCharts.toggle(false);
	} else if (isHarbourLimitsOverlay(name)) {
		storage.setItem(SETTINGS_STORAGE_KEYS.displayHarbours, "false");
		harbourDisplay?.update({ enabled: false });
	} else {
		storage.removeItem(SETTINGS_STORAGE_KEYS.overlayLayer);
	}
}

export function createChartLayerEventHandlers({
	autoCharts,
	displaySettings,
	storage = globalThis.localStorage,
	harbourDisplay,
}) {
	function handleBaseLayerChange(event) {
		applyBaseLayerChange({
			autoCharts,
			displaySettings,
			storage,
			name: event.name,
		});
	}

	function handleOverlayAdd(event) {
		applyOverlayAdded({
			autoCharts,
			displaySettings,
			storage,
			harbourDisplay,
			name: event.name,
		});
	}

	function handleOverlayRemove(event) {
		applyOverlayRemoved({
			autoCharts,
			storage,
			harbourDisplay,
			name: event.name,
		});
	}

	return {
		handleBaseLayerChange,
		handleOverlayAdd,
		handleOverlayRemove,
	};
}
