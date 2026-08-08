/**
 * Provides controller helpers for auto chart in the AJRM Marine Display browser application.
 */

import { createAutoChartLayerState } from "./auto-chart-layer-state.mjs";
import { createChartLeafletLayer } from "./chart-leaflet-layer-factory.mjs";

export function ensureAutoChartGroupVisible({ enabled, group, map }) {
	if (enabled && !map.hasLayer(group)) {
		group.addTo(map);
		return true;
	}
	return false;
}

export function shouldUpdateAutoChartLayer({ group, map }) {
	return Boolean(map._loaded && map.hasLayer(group));
}

export function createAutoChartLayerMaker({
	L,
	labelRules,
	paintRules,
	protomapsL,
}) {
	return (chart) =>
		createChartLeafletLayer({
			L,
			protomapsL,
			chart,
			paintRules,
			labelRules,
		});
}

export function createAutoChartControllerParts({
	L,
	labelRules,
	paintRules,
	protomapsL,
}) {
	return {
		group: L.layerGroup(),
		layerState: createAutoChartLayerState(),
		makeChartLayer: createAutoChartLayerMaker({
			L,
			labelRules,
			paintRules,
			protomapsL,
		}),
	};
}
