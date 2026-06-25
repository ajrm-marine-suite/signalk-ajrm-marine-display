export function chartLayerSetupStepConfig({
	createLayerController,
	map,
	baseMaps,
	overlayMaps,
	autoCharts,
	harbourDisplay,
	displaySettings,
	storage,
	diagnostics,
}) {
	return {
		createLayerController,
		map,
		baseMaps,
		overlayMaps,
		autoCharts,
		harbourDisplay,
		displaySettings,
		storage,
		diagnostics,
	};
}

export function chartSelectorSetupStepConfig({
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
	return {
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
	};
}

export function chartToolbarSetupStepConfig({
	createToolbar,
	map,
	easyButton,
	offcanvas,
	document,
	diagnostics,
}) {
	return {
		createToolbar,
		map,
		easyButton,
		offcanvas,
		document,
		diagnostics,
	};
}

export function chartStartupSetupStepConfig({
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
	return {
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
	};
}
