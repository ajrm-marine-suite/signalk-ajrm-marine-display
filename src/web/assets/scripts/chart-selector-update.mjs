import {
	updateBaseLayerInputs,
	updateOverlayInputs,
} from "./chart-selector-panel.mjs";

export function chartSelectorPanelForControl(control) {
	return control.getContainer()?._ajrmMarineChartPanel || null;
}

export function updateChartSelectorPanel({
	control,
	getBaseLayerName,
	isOverlayEnabled,
}) {
	const panel = chartSelectorPanelForControl(control);
	if (!panel) return;
	updateBaseLayerInputs(panel, getBaseLayerName);
	updateOverlayInputs(panel, isOverlayEnabled);
}
