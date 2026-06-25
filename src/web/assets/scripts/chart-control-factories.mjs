import { createChartLayerController } from "./chart-layer-controller.mjs";
import { createChartSelectorControl } from "./chart-selector-control.mjs";
import { applyChartStartup } from "./chart-startup-apply.mjs";
import { createMapToolbarButtons } from "./map-toolbar-buttons.mjs";

export function defaultChartControlFactories() {
	return {
		createChartLayerController,
		createChartSelectorControl,
		createMapToolbarButtons,
		applyChartStartup,
	};
}

export function resolveChartControlFactories(factories = {}) {
	const defaults = defaultChartControlFactories();
	return {
		createLayerController:
			factories.createChartLayerController ?? defaults.createChartLayerController,
		createSelector:
			factories.createChartSelectorControl ?? defaults.createChartSelectorControl,
		createToolbar: factories.createMapToolbarButtons ?? defaults.createMapToolbarButtons,
		applyStartup: factories.applyChartStartup ?? defaults.applyChartStartup,
	};
}
