import { createDisplaySettingsController } from "./display-settings.mjs";
import { createHarbourDisplayController } from "./harbour-display.mjs";

export function resolveMapDisplaySupportFactories(factories = {}) {
	return {
		createDisplaySettings:
			factories.createDisplaySettingsController ??
			createDisplaySettingsController,
		createHarbourDisplay:
			factories.createHarbourDisplayController ?? createHarbourDisplayController,
	};
}
