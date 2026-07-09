export function startAppRefreshLoop({
	refreshController,
	intervalMs = 1000,
	setIntervalFn = setInterval,
}) {
	let running = false;
	let skipped = 0;

	async function runRefresh() {
		if (running) {
			skipped += 1;
			refreshController.recordSkippedRefresh?.(skipped);
			return;
		}
		const skippedRefreshes = skipped;
		skipped = 0;
		running = true;
		try {
			await refreshController.refresh({ skippedRefreshes });
		} finally {
			running = false;
		}
	}

	runRefresh();
	return setIntervalFn(runRefresh, intervalMs);
}
