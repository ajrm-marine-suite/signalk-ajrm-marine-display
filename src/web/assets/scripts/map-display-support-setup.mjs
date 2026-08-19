/**
 * Wires runtime dependencies for map display support in the AJRM Marine Display browser application.
 */

import { resolveMapDisplaySupportFactories } from "./map-display-support-factories.mjs";
import { SETTINGS_STORAGE_KEYS } from "./settings-storage-keys.mjs";

export function profileAreasUrl(_pluginId) {
	return `/signalk/v1/api/ajrmMarineDisplay/profileAreas`;
}

export async function fetchProfileAreas({ pluginId, getHttpResponse }) {
	return (
		(
			await getHttpResponse(profileAreasUrl(pluginId), {
				ignoreEmptyResponse: true,
			})
		)?.profileAreas || []
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
		controls.selfIconOrientation = mapControls.selfIconOrientation;
		controls.selfIconFillColor = mapControls.selfIconFillColor;
		controls.selfIconScalePercent = mapControls.selfIconScalePercent;
		controls.selfIconScaleValue = mapControls.selfIconScaleValue;
		controls.mapFollowLookAheadPercent = mapControls.mapFollowLookAheadPercent;
		controls.mapFollowLookAheadValue = mapControls.mapFollowLookAheadValue;
		controls.selfTcpaGuideMode = mapControls.selfTcpaGuideMode;
		controls.selfTcpaGuideLargeColor = mapControls.selfTcpaGuideLargeColor;
		controls.selfTcpaGuideMediumColor = mapControls.selfTcpaGuideMediumColor;
		controls.selfTcpaGuideSmallColor = mapControls.selfTcpaGuideSmallColor;
	}
	return controls;
}

export function createProfileAreaProvider({ pluginId, getHttpResponse }) {
	return async () => fetchProfileAreas({ pluginId, getHttpResponse });
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
		getRegions: createProfileAreaProvider({ pluginId, getHttpResponse }),
		initialEnabled:
			storage?.getItem?.(SETTINGS_STORAGE_KEYS.displayHarbours) !== "false",
	});

	return {
		displaySettings,
		harbourDisplay,
	};
}
