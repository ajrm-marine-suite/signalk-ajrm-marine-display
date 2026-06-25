import { resolveChartStartupState } from "./chart-startup-state.mjs";
import { SETTINGS_STORAGE_KEYS } from "./settings-storage-keys.mjs";

export function storedChartStartupSettings(storage) {
	return {
		storedBaseLayer: storage.getItem(SETTINGS_STORAGE_KEYS.baseLayer),
		storedOverlay: storage.getItem(SETTINGS_STORAGE_KEYS.overlayLayer),
		storedAutoCharts: storage.getItem(SETTINGS_STORAGE_KEYS.autoCharts),
	};
}

export function resolveChartStartupFromStorage({
	storage,
	baseMaps,
	overlayMaps,
	resolveStartupState = resolveChartStartupState,
}) {
	return resolveStartupState({
		...storedChartStartupSettings(storage),
		baseMaps,
		overlayMaps,
	});
}
