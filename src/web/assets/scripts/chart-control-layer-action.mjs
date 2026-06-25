import {
	CHART_CONTROL_DIAGNOSTIC_STEPS,
	recordChartDiagnostic,
} from "./chart-startup-diagnostics.mjs";

export function createChartLayerControllerWithDiagnostics({
	createLayerController,
	map,
	baseMaps,
	overlayMaps,
	autoCharts,
	harbourDisplay,
	displaySettings,
	storage,
	diagnostics,
}) {
	const chartLayerController = createConfiguredChartLayerController({
		createLayerController,
		map,
		baseMaps,
		overlayMaps,
		autoCharts,
		harbourDisplay,
		displaySettings,
		storage,
	});
	recordChartDiagnostic(
		diagnostics,
		CHART_CONTROL_DIAGNOSTIC_STEPS.layerControllerCreated,
	);
	return chartLayerController;
}

export function createConfiguredChartLayerController({
	createLayerController,
	map,
	baseMaps,
	overlayMaps,
	autoCharts,
	harbourDisplay,
	displaySettings,
	storage,
}) {
	return createLayerController({
		map,
		baseMaps,
		overlayMaps,
		autoCharts,
		harbourDisplay,
		displaySettings,
		storage,
	});
}
