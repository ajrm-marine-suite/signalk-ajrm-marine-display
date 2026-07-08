import { bootstrapApp } from "./app-bootstrap.mjs";
import { loadInitialAppSettings } from "./app-initial-settings.mjs";
import { loadStartupData } from "./startup-data-service.mjs";

export function startupDataBootstrapConfig({
	pluginId,
	collisionProfileService,
	selectActiveProfile,
	getHttpResponse,
	speechControls,
	mapControls,
	setStationaryAutomuteSpeed,
	autoProfileSettings,
	speechOutput,
	factories = {},
}) {
	return {
		pluginId,
		collisionProfileService,
		selectActiveProfile,
		loadInitialAppSettings:
			factories.loadInitialAppSettings ?? loadInitialAppSettings,
		getHttpResponse,
		speechControls,
		mapControls,
		setStationaryAutomuteSpeed,
		autoProfileSettings,
		speechOutput,
		loadStartupData: factories.loadStartupData ?? loadStartupData,
	};
}

export function loadConfiguredStartupData(configInput) {
	const bootstrap = configInput.factories?.bootstrapApp ?? bootstrapApp;
	return bootstrap(startupDataBootstrapConfig(configInput));
}
