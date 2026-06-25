export const AUTO_CHART_STARTUP_UPDATE_DELAYS_MS = [100, 500, 1500];
export const AUTO_CHART_RESOURCE_RETRY_DELAYS_MS = [
	1000,
	2000,
	3000,
	5000,
	10000,
	15000,
	20000,
	30000,
	45000,
	60000,
];

export function scheduleAutoChartUpdates(autoCharts, schedule = setTimeout) {
	for (const delay of AUTO_CHART_STARTUP_UPDATE_DELAYS_MS) {
		schedule(() => autoCharts.update(), delay);
	}
}

export function scheduleAutoChartResourceRefreshes(
	autoCharts,
	schedule = setTimeout,
) {
	if (typeof autoCharts?.refreshCharts !== "function") return;
	for (const delay of AUTO_CHART_RESOURCE_RETRY_DELAYS_MS) {
		schedule(async () => {
			let changed = false;
			try {
				changed = await autoCharts.refreshCharts();
			} catch {
				changed = false;
			}
			if (changed) autoCharts.update();
		}, delay);
	}
}

export function applyAutoChartsStartup({ autoCharts, autoChartsEnabled, schedule = setTimeout }) {
	if (!autoChartsEnabled) {
		autoCharts.toggle(false);
		return;
	}
	autoCharts.ensureVisible();
	scheduleAutoChartUpdates(autoCharts, schedule);
	scheduleAutoChartResourceRefreshes(autoCharts, schedule);
}
