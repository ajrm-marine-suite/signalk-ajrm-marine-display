import { createAutoChartController } from "./auto-chart-controller.mjs";
import { createChartMapLayers } from "./chart-map-layer-factories.mjs";
import { createMapFollowController } from "./map-follow-control.mjs";

export function resolveMapRuntimeFactories(factories = {}) {
	return {
		createMapLayers: factories.createChartMapLayers || createChartMapLayers,
		createAutoCharts:
			factories.createAutoChartController || createAutoChartController,
		createMapFollow:
			factories.createMapFollowController || createMapFollowController,
	};
}
