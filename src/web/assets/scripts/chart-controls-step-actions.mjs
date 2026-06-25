import {
	applyChartStartupWithDiagnostics,
	createChartLayerControllerWithDiagnostics,
	createChartSelectorWithDiagnostics,
	createChartToolbarWithDiagnostics,
} from "./chart-control-diagnostic-actions.mjs";

export function chartControlSetupResult({
	chartLayerController,
	chartSelectorControl,
	overlayMaps,
}) {
	return {
		chartLayerController,
		chartSelectorControl,
		overlayMaps,
	};
}

export function createChartLayerSetupStep({
	map,
	baseMaps,
	overlayMaps,
	autoCharts,
	harbourDisplay,
	displaySettings,
	storage,
	diagnostics,
	createLayerController,
}) {
	return createChartLayerControllerWithDiagnostics({
		createLayerController,
		map,
		baseMaps,
		overlayMaps,
		autoCharts,
		harbourDisplay,
		displaySettings,
		storage,
		diagnostics,
	});
}

export function createChartSelectorSetupStep({
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
	return createChartSelectorWithDiagnostics({
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
	});
}

export function createChartToolbarSetupStep({
	createToolbar,
	map,
	easyButton,
	offcanvas,
	document,
	diagnostics,
}) {
	createChartToolbarWithDiagnostics({
		createToolbar,
		map,
		easyButton,
		offcanvas,
		document,
		diagnostics,
	});
}

export function applyChartStartupSetupStep({
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
	applyChartStartupWithDiagnostics({
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
}
