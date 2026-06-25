export function registerChartLayerEventBindings({
	map,
	handleBaseLayerChange,
	handleOverlayAdd,
	handleOverlayRemove,
}) {
	map.on("baselayerchange", handleBaseLayerChange);
	map.on("overlayadd", handleOverlayAdd);
	map.on("overlayremove", handleOverlayRemove);
}
