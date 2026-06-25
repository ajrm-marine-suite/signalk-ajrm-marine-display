import {
	addStartupOverlay,
	applyAutoChartsStartup,
	persistAndAddBaseLayer,
	refreshStartupUi,
} from "./chart-startup-actions.mjs";
import {
	CHART_STARTUP_DIAGNOSTIC_STEPS,
	recordChartDiagnostic,
} from "./chart-startup-diagnostics.mjs";

export function applyResolvedChartStartup({
	map,
	baseMaps,
	overlayMaps,
	autoCharts,
	harbourDisplay,
	chartLayerController,
	displaySettings,
	storage,
	schedule = setTimeout,
	chartStartupState,
	diagnostics,
}) {
	applyStartupBaseLayerStep({
		map,
		baseMaps,
		storage,
		baseLayerName: chartStartupState.baseLayerName,
		diagnostics,
	});
	applyStartupAutoChartsStep({
		autoCharts,
		autoChartsEnabled: chartStartupState.autoChartsEnabled,
		schedule,
		diagnostics,
	});
	applyStartupOverlayStep({
		map,
		overlayMaps,
		overlayName: chartStartupState.overlayName,
		diagnostics,
	});
	applyStartupHarbourLimitsStep({ harbourDisplay, diagnostics });
	applyStartupUiStep({ chartLayerController, displaySettings, diagnostics });
}

export function applyStartupBaseLayerStep({
	map,
	baseMaps,
	storage,
	baseLayerName,
	diagnostics,
}) {
	persistAndAddBaseLayer({
		storage,
		baseMaps,
		baseLayerName,
		map,
	});
	recordChartDiagnostic(diagnostics, CHART_STARTUP_DIAGNOSTIC_STEPS.baseLayerAdded, {
		baseLayerName,
	});
}

export function applyStartupAutoChartsStep({
	autoCharts,
	autoChartsEnabled,
	schedule,
	diagnostics,
}) {
	applyAutoChartsStartup({
		autoCharts,
		autoChartsEnabled,
		schedule,
	});
	recordChartDiagnostic(
		diagnostics,
		CHART_STARTUP_DIAGNOSTIC_STEPS.autoChartsApplied,
		{
			autoChartsEnabled,
		},
	);
}

export function applyStartupOverlayStep({
	map,
	overlayMaps,
	overlayName,
	diagnostics,
}) {
	addStartupOverlay({
		overlayMaps,
		overlayName,
		map,
	});
	recordChartDiagnostic(diagnostics, CHART_STARTUP_DIAGNOSTIC_STEPS.overlayAdded, {
		overlayName,
	});
}

export function applyStartupUiStep({
	chartLayerController,
	displaySettings,
	diagnostics,
}) {
	refreshStartupUi({ chartLayerController, displaySettings });
	recordChartDiagnostic(diagnostics, CHART_STARTUP_DIAGNOSTIC_STEPS.uiRefreshed);
}

export function applyStartupHarbourLimitsStep({ harbourDisplay }) {
	if (harbourDisplay?.isEnabled?.() === true) {
		harbourDisplay.update({ enabled: true });
	}
}
