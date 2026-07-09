export function refreshMapViewForSelfTarget({
	selfTarget,
	map,
	shouldFollow,
	disableMapPanTo,
	setDisableMoveend,
	drawRangeRings,
	autoCharts,
	updateHarbourDisplay,
	debugControls = {},
	fallbackCenter = [55.8, -5.2],
	fallbackZoom = 12,
}) {
	if (selfTarget?.isValid) {
		if (shouldFollow && !disableMapPanTo) {
			try {
				setDisableMoveend(true);
				map.panTo([selfTarget.latitude, selfTarget.longitude], {
					animate: false,
				});
			} finally {
				setDisableMoveend(false);
			}
		}

		if (disableMapPanTo) return;

		drawRangeRings({ enabled: debugControls.rangeRings !== false });
		if (debugControls.autoCharts !== false) autoCharts.update();
		if (debugControls.harbourLayer !== false) updateHarbourDisplay();
		return;
	}

	if (disableMapPanTo && map._loaded) return;

	if (!map._loaded) map.setView(fallbackCenter, fallbackZoom);
	if (debugControls.autoCharts !== false) autoCharts.update();
	if (debugControls.harbourLayer !== false) updateHarbourDisplay();
}
