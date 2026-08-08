/**
 * Provides actions for chart layer auto in the AJRM Marine Display browser application.
 */

export function updateEnabledAutoCharts(autoCharts) {
	autoCharts.resetFallback();
	autoCharts.update();
	autoCharts.keepOnTop();
}

export function refreshAutoChartsAfterBaseLayerChange(autoCharts) {
	if (!autoCharts.enabled) return;
	updateEnabledAutoCharts(autoCharts);
}
