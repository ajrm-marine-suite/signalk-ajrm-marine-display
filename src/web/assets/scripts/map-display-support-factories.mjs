/**
 * Creates runtime objects for map display support in the AJRM Marine Display browser application.
 */

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
