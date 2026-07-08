import assert from "node:assert/strict";
import test from "node:test";

import {
	createDisplayRefreshDebug,
	createRefreshDiagnosticPoster,
} from "../src/web/assets/scripts/display-refresh-debug.mjs";

test("Display refresh debug records sync and async phase timings", async () => {
	let now = 0;
	const diagnostics = [];
	const windowRef = {
		AJRM_MARINE_DISPLAY_DEBUG: true,
		localStorage: { getItem: () => "" },
	};
	const debug = createDisplayRefreshDebug({
		windowRef,
		performanceRef: { now: () => now },
		postDiagnostic: (sample) => diagnostics.push(sample),
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
	assert.equal(diagnostics.length, 1);
	assert.match(diagnostics[0].summary, /total=6ms/);
});

test("Display refresh debug throttles slow diagnostic posts", () => {
	let now = 0;
	const diagnostics = [];
	const debug = createDisplayRefreshDebug({
		windowRef: {
			AJRM_MARINE_DISPLAY_DEBUG: true,
			localStorage: { getItem: () => "" },
		},
		performanceRef: { now: () => now },
		postDiagnostic: (sample) => diagnostics.push(sample),
		slowRefreshMs: 5,
		reportIntervalMs: 100,
	});

	for (const elapsedMs of [10, 20, 150]) {
		const sample = debug.start();
		now += elapsedMs;
		sample.finish({ counts: { targets: 1, boatMarkers: 1 } });
	}

	assert.equal(diagnostics.length, 2);
	assert.match(diagnostics[0].summary, /targets=1; markers=1/);
});

test("Display refresh diagnostic poster writes to server endpoint", async () => {
	const requests = [];
	const poster = createRefreshDiagnosticPoster({
		windowRef: {
			navigator: { userAgent: "test-browser" },
			fetch: async (url, options) => {
				requests.push({ url, options });
			},
		},
		consoleRef: { debug() {} },
	});

	poster({ totalMs: 800, counts: { targets: 4 } });
	await Promise.resolve();

	assert.equal(
		requests[0].url,
		"/signalk/v1/api/ajrmMarineDisplay/refreshDiagnostics",
	);
	assert.equal(requests[0].options.method, "POST");
	assert.equal(requests[0].options.keepalive, true);
	assert.equal(JSON.parse(requests[0].options.body).userAgent, "test-browser");
});
