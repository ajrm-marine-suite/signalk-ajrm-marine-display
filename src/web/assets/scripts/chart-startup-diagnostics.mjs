import {
	appendChartDiagnosticEntry,
	safeTimestamp,
	serializeChartStartupError,
} from "./chart-startup-diagnostic-store.mjs";
export {
	recordChartDiagnostic,
	recordChartDiagnosticError,
} from "./chart-startup-diagnostic-recorders.mjs";

export const DEFAULT_CHART_DIAGNOSTIC_LIMIT = 100;
export const DEFAULT_CHART_DIAGNOSTIC_KEY = "ajrmMarineChartDiagnostics";
export const CHART_STARTUP_DIAGNOSTIC_STEPS = {
	start: "chart-startup:start",
	resolved: "chart-startup:resolved",
	baseLayerAdded: "chart-startup:base-layer-added",
	autoChartsApplied: "chart-startup:auto-charts-applied",
	overlayAdded: "chart-startup:overlay-added",
	uiRefreshed: "chart-startup:ui-refreshed",
	error: "chart-startup:error",
};
export const CHART_CONTROL_DIAGNOSTIC_STEPS = {
	start: "chart-controls:start",
	layerControllerCreated: "chart-controls:layer-controller-created",
	selectorCreated: "chart-controls:selector-created",
	selectorAdded: "chart-controls:selector-added",
	toolbarCreated: "chart-controls:toolbar-created",
	startupApplied: "chart-controls:startup-applied",
	error: "chart-controls:error",
};

export function createChartStartupDiagnostics({
	sink = globalThis,
	key = DEFAULT_CHART_DIAGNOSTIC_KEY,
	limit = DEFAULT_CHART_DIAGNOSTIC_LIMIT,
	now = () => new Date().toISOString(),
} = {}) {
	const target = sink?.[key] || { entries: [] };
	if (sink) sink[key] = target;
	return {
		record(step, details = {}) {
			return appendChartDiagnosticEntry(
				target,
				{ ts: safeTimestamp(now), step, details },
				limit,
			);
		},
		error(step, error, details = {}) {
			return appendChartDiagnosticEntry(
				target,
				{
					ts: safeTimestamp(now),
					step,
					details,
					error: serializeChartStartupError(error),
				},
				limit,
			);
		},
		get entries() {
			return target.entries;
		},
	};
}

export function chartMapNames(layerMap) {
	return Object.keys(layerMap || {});
}
