import {
	CHART_STARTUP_DIAGNOSTIC_STEPS,
	chartMapNames,
	recordChartDiagnostic,
	recordChartDiagnosticError,
} from "./chart-startup-diagnostics.mjs";
import { applyResolvedChartStartup } from "./chart-startup-sequence.mjs";
import { resolveChartStartupWithDiagnostics } from "./chart-startup-resolution-action.mjs";
import { resolveChartStartupState } from "./chart-startup-state.mjs";

export { resolveChartStartupWithDiagnostics } from "./chart-startup-resolution-action.mjs";

export function applyChartStartup({
	map,
	baseMaps,
	overlayMaps,
	autoCharts,
	harbourDisplay,
	chartLayerController,
	displaySettings,
	storage = localStorage,
	schedule = setTimeout,
	resolveStartupState = resolveChartStartupState,
	diagnostics,
}) {
	recordChartDiagnostic(diagnostics, CHART_STARTUP_DIAGNOSTIC_STEPS.start, {
		baseMaps: chartMapNames(baseMaps),
		overlayMaps: chartMapNames(overlayMaps),
	});
	try {
		const chartStartupState = resolveChartStartupWithDiagnostics({
			storage,
			baseMaps,
			overlayMaps,
			resolveStartupState,
			diagnostics,
		});
		applyResolvedChartStartup({
			map,
			baseMaps,
			overlayMaps,
			autoCharts,
			harbourDisplay,
			chartLayerController,
			displaySettings,
			storage,
			schedule,
			chartStartupState,
			diagnostics,
		});

		return chartStartupState;
	} catch (error) {
		recordChartDiagnosticError(
			diagnostics,
			CHART_STARTUP_DIAGNOSTIC_STEPS.error,
			error,
		);
		throw error;
	}
}
