/**
 * Wires runtime dependencies for main event binding in the AJRM Marine Display browser application.
 */

import { registerConfiguredAppEventBindings } from "./app-event-registration-setup.mjs";
import { mainEventBindingConfig } from "./main-event-binding-configs.mjs";

export {
	mainEventBindingActions,
	mainEventBindingConfig,
	mainEventBindingState,
} from "./main-event-binding-configs.mjs";

export function registerMainAppEventBindings({
	...configInput
}) {
	registerConfiguredAppEventBindings(mainEventBindingConfig(configInput));
}
