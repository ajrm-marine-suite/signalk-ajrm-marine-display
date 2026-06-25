import { resolveMapDisplaySupportFactories } from "./map-display-support-factories.mjs";
import { SETTINGS_STORAGE_KEYS } from "./settings-storage-keys.mjs";

export function harbourRegionsUrl(_pluginId) {
	return `/signalk/v1/api/ajrmMarineDisplay/harbourRegions`;
}

export async function fetchHarbourRegions({ pluginId, getHttpResponse }) {
	return (
		(
			await getHttpResponse(harbourRegionsUrl(pluginId), {
				ignoreEmptyResponse: true,
			})
		)?.regions || []
	);
}

export function createDisplaySettingsControls(elements = {}, mapControls = {}) {
	const controls = {
		fullScreen: elements.checkFullScreen,
		darkMode: elements.checkDarkMode,
		noSleep: elements.checkNoSleep,
	};
	if (mapControls.selfTcpaGuideMode) {
		controls.selfIconVariant = mapControls.selfIconVariant;
		controls.selfIconFillColor = mapControls.selfIconFillColor;
		controls.selfTcpaGuideMode = mapControls.selfTcpaGuideMode;
		controls.selfTcpaGuideLargeColor = mapControls.selfTcpaGuideLargeColor;
		controls.selfTcpaGuideMediumColor = mapControls.selfTcpaGuideMediumColor;
		controls.selfTcpaGuideSmallColor = mapControls.selfTcpaGuideSmallColor;
	}
	return controls;
}

export function createHarbourRegionProvider({ pluginId, getHttpResponse }) {
	return async () => fetchHarbourRegions({ pluginId, getHttpResponse });
}

export function createConfiguredMapDisplaySupport({
	map,
	elements,
	mapControls,
	pluginId,
	getHttpResponse,
	onFullscreenToggled,
	storage = globalThis.localStorage,
	factories = {},
}) {
	const { createDisplaySettings, createHarbourDisplay } =
		resolveMapDisplaySupportFactories(factories);

	const displaySettings = createDisplaySettings({
		controls: createDisplaySettingsControls(elements, mapControls),
		onFullscreenToggled,
	});

	const harbourDisplay = createHarbourDisplay({
		map,
		getRegions: createHarbourRegionProvider({ pluginId, getHttpResponse }),
		initialEnabled:
			storage?.getItem?.(SETTINGS_STORAGE_KEYS.displayHarbours) !== "false",
	});

	return {
		displaySettings,
		harbourDisplay,
	};
}
