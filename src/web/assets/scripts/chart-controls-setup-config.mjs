import { resolveChartControlFactories } from "./chart-control-factories.mjs";
import { createOverlayMaps } from "./chart-control-overlays.mjs";
import {
	CHART_CONTROL_DIAGNOSTIC_STEPS,
	chartMapNames,
	recordChartDiagnostic,
} from "./chart-startup-diagnostics.mjs";

export function resolveConfiguredChartControlInputs({
	baseMaps,
	openSeaMap,
	autoCharts,
	harbourDisplay,
	factories,
	diagnostics,
}) {
	const resolvedFactories = resolveChartControlFactories(factories);
	const overlayMaps = createOverlayMaps({ openSeaMap, autoCharts, harbourDisplay });
	recordChartDiagnostic(diagnostics, CHART_CONTROL_DIAGNOSTIC_STEPS.start, {
		baseMaps: chartMapNames(baseMaps),
		overlayMaps: chartMapNames(overlayMaps),
	});

	return {
		...resolvedFactories,
		overlayMaps,
	};
}
