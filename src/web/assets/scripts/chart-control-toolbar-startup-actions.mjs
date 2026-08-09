/**
 * Provides actions for chart control toolbar startup in the AJRM Marine Display browser application.
 */

import {
	CHART_CONTROL_DIAGNOSTIC_STEPS,
	recordChartDiagnostic,
} from "./chart-startup-diagnostics.mjs";

export function createChartToolbarWithDiagnostics({
	createToolbar,
	map,
	easyButton,
	offcanvas,
	document,
	autoCharts,
	diagnostics,
}) {
	createConfiguredChartToolbar({
		createToolbar,
		map,
		easyButton,
		offcanvas,
		document,
		autoCharts,
	});
	recordChartDiagnostic(
		diagnostics,
		CHART_CONTROL_DIAGNOSTIC_STEPS.toolbarCreated,
	);
}

export function createConfiguredChartToolbar({
	createToolbar,
	map,
	easyButton,
	offcanvas,
	document,
	autoCharts,
}) {
	createToolbar({ map, easyButton, offcanvas, autoCharts, document });
}

export function applyChartStartupWithDiagnostics({
	applyStartup,
	map,
	baseMaps,
	overlayMaps,
	autoCharts,
	harbourDisplay,
	chartLayerController,
	displaySettings,
	storage,
	diagnostics,
}) {
	applyConfiguredChartStartup({
		applyStartup,
		map,
		baseMaps,
		overlayMaps,
		autoCharts,
		harbourDisplay,
		chartLayerController,
		displaySettings,
		storage,
		diagnostics,
	});
	recordChartDiagnostic(diagnostics, CHART_CONTROL_DIAGNOSTIC_STEPS.startupApplied);
}

export function applyConfiguredChartStartup({
	applyStartup,
	map,
	baseMaps,
	overlayMaps,
	autoCharts,
	harbourDisplay,
	chartLayerController,
	displaySettings,
	storage,
	diagnostics,
}) {
	applyStartup({
		map,
		baseMaps,
		overlayMaps,
		autoCharts,
		harbourDisplay,
		chartLayerController,
		displaySettings,
		storage,
		diagnostics,
	});
}
