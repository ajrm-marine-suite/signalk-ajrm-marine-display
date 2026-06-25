import { registerProfileEventBindings } from "./app-profile-event-bindings.mjs";
import { registerMapFollowMoveEvents } from "./map-follow-events.mjs";
import { registerSpeechEventBindings } from "./app-speech-event-bindings.mjs";
import { registerTargetSilenceEventBindings } from "./app-target-silence-event-bindings.mjs";
import { registerDisplaySettingsEventBindings } from "./app-display-settings-event-bindings.mjs";
import { registerTargetSelectionEventBindings } from "./app-target-selection-event-bindings.mjs";
import { registerChartLayerEventBindings } from "./chart-layer-event-bindings.mjs";
import {
	chartLayerEventBindingConfig,
	displaySettingsEventBindingConfig,
	mapFollowEventBindingConfig,
	profileEventBindingConfig,
	speechEventBindingConfig,
	targetSelectionEventBindingConfig,
	targetSilenceEventBindingConfig,
} from "./app-event-binding-configs.mjs";

export function registerAppEventBindings({
	map,
	document,
	controls,
	controllers,
	state,
	actions,
}) {
	registerChartLayerEventBindings(chartLayerEventBindingConfig({ map, actions }));

	registerTargetSelectionEventBindings(targetSelectionEventBindingConfig({
		map,
		document,
		controls,
		controllers,
		state,
	}));

	registerProfileEventBindings(profileEventBindingConfig({
		document,
		controls,
		controllers,
		state,
		actions,
	}));

	registerTargetSilenceEventBindings(
		targetSilenceEventBindingConfig({ document, controllers }),
	);

	registerSpeechEventBindings(speechEventBindingConfig({ controls, controllers }));

	registerDisplaySettingsEventBindings(displaySettingsEventBindingConfig({
		document,
		controls,
		controllers,
		actions,
	}));

	registerMapFollowMoveEvents(mapFollowEventBindingConfig({
		map,
		state,
		controllers,
		actions,
	}));
}
