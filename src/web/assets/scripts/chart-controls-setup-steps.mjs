import {
	applyChartStartupSetupStep,
	chartControlSetupResult,
	createChartLayerSetupStep,
	createChartSelectorSetupStep,
	createChartToolbarSetupStep,
} from "./chart-controls-step-actions.mjs";
import {
	chartLayerSetupStepConfig,
	chartSelectorSetupStepConfig,
	chartStartupSetupStepConfig,
	chartToolbarSetupStepConfig,
} from "./chart-controls-step-configs.mjs";

export {
	applyChartStartupSetupStep,
	chartControlSetupResult,
	createChartLayerSetupStep,
	createChartSelectorSetupStep,
	createChartToolbarSetupStep,
} from "./chart-controls-step-actions.mjs";
export {
	chartLayerSetupStepConfig,
	chartSelectorSetupStepConfig,
	chartStartupSetupStepConfig,
	chartToolbarSetupStepConfig,
} from "./chart-controls-step-configs.mjs";

export function runChartControlSetupSteps({
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
	const chartLayerController = createChartLayerSetupStep(
		chartLayerSetupStepConfig({
			createLayerController,
			map,
			baseMaps,
			overlayMaps,
			autoCharts,
			harbourDisplay,
			displaySettings,
			storage,
			diagnostics,
		}),
	);

	const chartSelectorControl = createChartSelectorSetupStep(
		chartSelectorSetupStepConfig({
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
		}),
	);

	createChartToolbarSetupStep(
		chartToolbarSetupStepConfig({
			createToolbar,
			map,
			easyButton,
			offcanvas,
			document,
			diagnostics,
		}),
	);

	applyChartStartupSetupStep(
		chartStartupSetupStepConfig({
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
		}),
	);

	return chartControlSetupResult({
		chartLayerController,
		chartSelectorControl,
		overlayMaps,
	});
}
