export function refreshMapViewForSelfTarget({
	selfTarget,
	map,
	shouldFollow,
	disableMapPanTo,
	setDisableMoveend,
	drawRangeRings,
	autoCharts,
	updateHarbourDisplay,
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

		drawRangeRings();
		autoCharts.update();
		updateHarbourDisplay();
		return;
	}

	if (disableMapPanTo && map._loaded) return;

	if (!map._loaded) map.setView(fallbackCenter, fallbackZoom);
	autoCharts.update();
	updateHarbourDisplay();
}
