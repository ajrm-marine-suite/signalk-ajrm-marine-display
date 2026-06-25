import {
	clearAutoChartLayer,
	hasActiveAutoChartLayer,
	setAutoChartLayer,
} from "./auto-chart-layer-state.mjs";

export function updateAutoChartLayer({
	group,
	keepOnTop,
	makeChartLayer,
	selected,
	state,
}) {
	if (!selected) {
		if (!state.chartId && !state.chartLayer) return false;
		clearAutoChartLayer({ group, state });
		keepOnTop();
		return true;
	}
	if (hasActiveAutoChartLayer({ group, selected, state })) {
		return false;
	}
	const chartLayer = makeChartLayer(selected);
	if (setAutoChartLayer({ group, layer: chartLayer, selected, state })) {
		keepOnTop();
		return true;
	}
	return false;
}
