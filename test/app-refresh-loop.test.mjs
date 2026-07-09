import assert from "node:assert/strict";
import test from "node:test";

import { startAppRefreshLoop } from "../src/web/assets/scripts/app-refresh-loop.mjs";

test("startAppRefreshLoop starts immediately and schedules periodic refreshes", () => {
	const calls = [];
	const intervals = [];
	const controller = {
		refresh: (info) => {
			calls.push(info);
		},
	};

	const intervalId = startAppRefreshLoop({
		refreshController: controller,
		intervalMs: 1234,
		setIntervalFn(callback, intervalMs) {
			intervals.push({ callback, intervalMs });
			return "timer";
		},
	});

	assert.equal(intervalId, "timer");
	assert.equal(calls.length, 1);
	assert.equal(calls[0].skippedRefreshes, 0);
	assert.equal(intervals.length, 1);
	assert.equal(intervals[0].intervalMs, 1234);
});

test("startAppRefreshLoop skips overlapping refreshes and reports them next run", async () => {
	let resolveRefresh;
	const calls = [];
	const skippedReports = [];
	const controller = {
		refresh: (info) => {
			calls.push(info);
			return new Promise((resolve) => {
				resolveRefresh = resolve;
			});
		},
		recordSkippedRefresh: (count) => skippedReports.push(count),
	};
	let scheduled;
	startAppRefreshLoop({
		refreshController: controller,
		setIntervalFn(callback) {
			scheduled = callback;
		},
	});

	scheduled();
	scheduled();
	assert.deepEqual(skippedReports, [1, 2]);
	assert.equal(calls.length, 1);

	resolveRefresh();
	await Promise.resolve();
	scheduled();
	assert.equal(calls.length, 2);
	assert.equal(calls[1].skippedRefreshes, 2);
});
