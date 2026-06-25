import { runChartControlSetupSteps } from "./chart-controls-setup-steps.mjs";
import {
	CHART_CONTROL_DIAGNOSTIC_STEPS,
	recordChartDiagnosticError,
} from "./chart-startup-diagnostics.mjs";

export {
	applyConfiguredChartStartup,
	applyChartStartupWithDiagnostics,
	attachChartSelectorControl,
	createConfiguredChartToolbar,
	createConfiguredChartLayerController,
	createConfiguredChartSelectorControl,
	createChartLayerControllerWithDiagnostics,
	createChartSelectorWithDiagnostics,
	createChartToolbarWithDiagnostics,
} from "./chart-control-diagnostic-actions.mjs";
export {
	chartLayerSetupStepConfig,
	chartSelectorSetupStepConfig,
	chartStartupSetupStepConfig,
	chartToolbarSetupStepConfig,
	chartControlSetupResult,
	applyChartStartupSetupStep,
	createChartLayerSetupStep,
	createChartSelectorSetupStep,
	createChartToolbarSetupStep,
	runChartControlSetupSteps,
} from "./chart-controls-setup-steps.mjs";

export function runConfiguredChartControlSetup({
	L,
	map,
	easyButton,
	offcanvas,
	document,
	baseMaps,
	overlayMaps,
	autoCharts,
	harbourDisplay,
	displaySettings,
	escapeHtml,
	storage,
	diagnostics,
	createLayerController,
	createSelector,
	createToolbar,
	applyStartup,
}) {
	try {
		return runChartControlSetupSteps({
			L,
			map,
			easyButton,
			offcanvas,
			document,
			baseMaps,
			overlayMaps,
			autoCharts,
			harbourDisplay,
			displaySettings,
			escapeHtml,
			storage,
			diagnostics,
			createLayerController,
			createSelector,
			createToolbar,
			applyStartup,
		});
	} catch (error) {
		recordChartDiagnosticError(
			diagnostics,
			CHART_CONTROL_DIAGNOSTIC_STEPS.error,
			error,
		);
		throw error;
	}
}
