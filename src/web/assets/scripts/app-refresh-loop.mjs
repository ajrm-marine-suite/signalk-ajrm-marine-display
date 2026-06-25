export function startAppRefreshLoop({
	refreshController,
	intervalMs = 1000,
	setIntervalFn = setInterval,
}) {
	refreshController.refresh();
	return setIntervalFn(refreshController.refresh, intervalMs);
}
