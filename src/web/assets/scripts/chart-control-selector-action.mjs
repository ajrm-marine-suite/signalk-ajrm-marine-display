import { createConfiguredChartSelector } from "./chart-selector-setup.mjs";
import {
	CHART_CONTROL_DIAGNOSTIC_STEPS,
	recordChartDiagnostic,
} from "./chart-startup-diagnostics.mjs";

export function createConfiguredChartSelectorControl({
	L,
	map,
	baseMaps,
	overlayMaps,
	autoCharts,
	harbourDisplay,
	chartLayerController,
	escapeHtml,
	storage,
	createSelector,
}) {
	return createConfiguredChartSelector({
		L,
		map,
		baseMaps,
		overlayMaps,
		autoCharts,
		harbourDisplay,
		chartLayerController,
		escapeHtml,
		storage,
		createSelector,
	});
}

export function attachChartSelectorControl({
	map,
	chartLayerController,
	chartSelectorControl,
}) {
	chartLayerController.setChartSelectorControl(chartSelectorControl);
	chartSelectorControl.control.addTo(map);
}

export function createChartSelectorWithDiagnostics({
	L,
	map,
	baseMaps,
	overlayMaps,
	autoCharts,
	harbourDisplay,
	chartLayerController,
	escapeHtml,
	storage,
	createSelector,
	diagnostics,
}) {
	const chartSelectorControl = createConfiguredChartSelectorControl({
		L,
		map,
		baseMaps,
		overlayMaps,
		autoCharts,
		harbourDisplay,
		chartLayerController,
		escapeHtml,
		storage,
		createSelector,
	});
	recordChartDiagnostic(
		diagnostics,
		CHART_CONTROL_DIAGNOSTIC_STEPS.selectorCreated,
	);
	attachChartSelectorControl({ map, chartLayerController, chartSelectorControl });
	recordChartDiagnostic(diagnostics, CHART_CONTROL_DIAGNOSTIC_STEPS.selectorAdded);
	return chartSelectorControl;
}
