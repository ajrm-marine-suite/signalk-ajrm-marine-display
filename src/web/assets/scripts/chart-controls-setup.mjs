import { resolveConfiguredChartControlInputs } from "./chart-controls-setup-config.mjs";
import { createChartStartupDiagnostics } from "./chart-startup-diagnostics.mjs";
import { runConfiguredChartControlSetup } from "./chart-controls-setup-flow.mjs";

export { createOverlayMaps } from "./chart-control-overlays.mjs";
export { resolveConfiguredChartControlInputs } from "./chart-controls-setup-config.mjs";
export { chartControlSetupResult } from "./chart-controls-setup-flow.mjs";

export function configuredChartControlSetupRunConfig({
	context,
	factoryBundle,
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
	if (context || factoryBundle) {
		return {
			...context,
			...factoryBundle,
		};
	}
	return {
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
	};
}

export function chartControlSetupContext({
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
}) {
	return {
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
	};
}

export function chartControlFactoryBundle({
	createLayerController,
	createSelector,
	createToolbar,
	applyStartup,
}) {
	return {
		createLayerController,
		createSelector,
		createToolbar,
		applyStartup,
	};
}

export function createConfiguredChartControls({
	L,
	map,
	easyButton,
	offcanvas,
	document,
	baseMaps,
	openSeaMap,
	autoCharts,
	harbourDisplay,
	displaySettings,
	escapeHtml,
	storage = globalThis.localStorage,
	factories = {},
	diagnostics = createChartStartupDiagnostics(),
}) {
	const {
		createLayerController,
		createSelector,
		createToolbar,
		applyStartup,
		overlayMaps,
	} = resolveConfiguredChartControlInputs({
		baseMaps,
		openSeaMap,
		autoCharts,
		harbourDisplay,
		factories,
		diagnostics,
	});

	return runConfiguredChartControlSetup(
		configuredChartControlSetupRunConfig({
			context: chartControlSetupContext({
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
			}),
			factoryBundle: chartControlFactoryBundle({
				createLayerController,
				createSelector,
				createToolbar,
				applyStartup,
			}),
		}),
	);
}
