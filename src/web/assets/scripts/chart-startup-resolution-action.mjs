import { resolveChartStartupFromStorage } from "./chart-startup-actions.mjs";
import {
	CHART_STARTUP_DIAGNOSTIC_STEPS,
	recordChartDiagnostic,
} from "./chart-startup-diagnostics.mjs";

export function resolveChartStartupWithDiagnostics({
	storage,
	baseMaps,
	overlayMaps,
	resolveStartupState,
	diagnostics,
}) {
	const chartStartupState = resolveChartStartupFromStorage({
		storage,
		baseMaps,
		overlayMaps,
		resolveStartupState,
	});
	recordChartDiagnostic(
		diagnostics,
		CHART_STARTUP_DIAGNOSTIC_STEPS.resolved,
		chartStartupState,
	);
	return chartStartupState;
}
