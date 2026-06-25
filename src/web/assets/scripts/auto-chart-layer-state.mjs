import { isLeafletLayer } from "./chart-leaflet-layer-factory.mjs";

export function createAutoChartLayerState() {
	return {
		chartId: null,
		chartLayer: null,
	};
}

export function clearAutoChartLayer({ group, state }) {
	group.clearLayers();
	state.chartId = null;
	state.chartLayer = null;
}

export function hasActiveAutoChartLayer({ group, selected, state }) {
	return (
		state.chartId === selected?.__autoChartId &&
		isLeafletLayer(state.chartLayer) &&
		group.hasLayer(state.chartLayer)
	);
}

export function setAutoChartLayer({ group, layer, selected, state }) {
	group.clearLayers();
	state.chartLayer = layer;
	state.chartId = selected?.__autoChartId ?? null;
	if (isLeafletLayer(state.chartLayer)) {
		group.addLayer(state.chartLayer);
		return true;
	}
	state.chartId = null;
	state.chartLayer = null;
	return false;
}

export function resetAutoChartFallback(state) {
	if (!state.chartLayer) state.chartId = null;
}
