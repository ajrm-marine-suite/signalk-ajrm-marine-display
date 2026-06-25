import { chooseAutoChartForMap } from "./auto-chart-selection.mjs";
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

export function createAutoChartChooser({ chartList, getPosition, map }) {
	return () => chooseAutoChartForMap({ chartList, map, getPosition });
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
	chartList,
	getPosition,
	labelRules,
	map,
	paintRules,
	protomapsL,
}) {
	return {
		chooseChart: createAutoChartChooser({ chartList, getPosition, map }),
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
