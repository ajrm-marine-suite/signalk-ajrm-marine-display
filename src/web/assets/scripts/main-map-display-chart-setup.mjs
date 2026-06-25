import { createConfiguredChartControls } from "./chart-controls-setup.mjs";
import { createConfiguredMapDisplaySupport } from "./map-display-support-setup.mjs";

export function mainMapDisplaySupportConfig({
	map,
	elements,
	mapControls,
	pluginId,
	getHttpResponse,
	autoCharts,
	storage,
}) {
	return {
		map,
		elements,
		mapControls,
		pluginId,
		getHttpResponse,
		onFullscreenToggled: () => autoCharts.update(),
		storage,
	};
}

export function mainMapChartControlsConfig({
	L,
	map,
	easyButton,
	offcanvas,
	document,
	baseMaps,
	OpenSeaMap,
	autoCharts,
	harbourDisplay,
	displaySettings,
	escapeHtml,
}) {
	return {
		L,
		map,
		easyButton,
		offcanvas,
		document,
		baseMaps,
		openSeaMap: OpenSeaMap,
		autoCharts,
		harbourDisplay,
		displaySettings,
		escapeHtml,
	};
}

export function mainMapDisplayChartRuntime({
	chartLayerController,
	displaySettings,
	harbourDisplay,
}) {
	return { chartLayerController, displaySettings, harbourDisplay };
}

export function createMainMapDisplayAndChartControls({
	L,
	map,
	easyButton,
	offcanvas,
	document,
	baseMaps,
	OpenSeaMap,
	autoCharts,
	elements,
	mapControls,
	pluginId,
	getHttpResponse,
	escapeHtml,
	createMapDisplaySupport = createConfiguredMapDisplaySupport,
	createChartControls = createConfiguredChartControls,
}) {
	const { displaySettings, harbourDisplay } = createMapDisplaySupport(
		mainMapDisplaySupportConfig({
			map,
			elements,
			mapControls,
			pluginId,
			getHttpResponse,
			autoCharts,
			storage: globalThis.localStorage,
		}),
	);

	const { chartLayerController } = createChartControls(
		mainMapChartControlsConfig({
			L,
			map,
			easyButton,
			offcanvas,
			document,
			baseMaps,
			OpenSeaMap,
			autoCharts,
			harbourDisplay,
			displaySettings,
			escapeHtml,
		}),
	);

	return mainMapDisplayChartRuntime({
		chartLayerController,
		displaySettings,
		harbourDisplay,
	});
}
