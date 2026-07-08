import assert from "node:assert/strict";
import test from "node:test";

import { createDisplayRefreshDebug } from "../src/web/assets/scripts/display-refresh-debug.mjs";

test("Display refresh debug records sync and async phase timings", async () => {
	let now = 0;
	const warnings = [];
	const windowRef = {
		AJRM_MARINE_DISPLAY_DEBUG: true,
		localStorage: { getItem: () => "" },
	};
	const debug = createDisplayRefreshDebug({
		windowRef,
		performanceRef: { now: () => now },
		consoleRef: { warn: (...args) => warnings.push(args) },
		slowRefreshMs: 5,
	});

	const sample = debug.start();
	const syncValue = sample.phase("sync", () => {
		now += 2;
		return "ok";
	});
	const asyncValue = await sample.phase("async", async () => {
		now += 4;
		return "done";
	});
	const finished = sample.finish({ counts: { targets: 3 } });

	assert.equal(syncValue, "ok");
	assert.equal(asyncValue, "done");
	assert.equal(finished.totalMs, 6);
	assert.deepEqual(finished.phases, { sync: 2, async: 4 });
	assert.equal(windowRef.ajrmMarineDisplayDebug().last.counts.targets, 3);
	assert.equal(windowRef.ajrmMarineDisplayRefreshStats().last.counts.targets, 3);
	assert.equal(windowRef.AJRMMarineDisplayDebug.last().counts.targets, 3);
	assert.equal(windowRef.AJRMMarineDisplayDebug.snapshot().last.counts.targets, 3);
	assert.equal(warnings.length, 1);
});
