/**
 * Binds events for chart layer in the AJRM Marine Display browser application.
 */

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
