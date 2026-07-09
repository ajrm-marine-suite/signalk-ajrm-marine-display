import assert from "node:assert/strict";
import test from "node:test";

import {
	browserPerformanceSample,
	startBrowserPerformanceDebug,
} from "../src/web/assets/scripts/browser-performance-debug.mjs";

test("browser performance sample summarizes event-loop and frame stalls", () => {
	const sample = browserPerformanceSample({
		reason: "frame-gap",
		frameGapMs: 375,
		maxEventLoopLag: 42,
		maxFrameGap: 375,
		windowRef: { document: { visibilityState: "visible" } },
	});

	assert.equal(sample.diagnosticType, "browser-performance");
	assert.equal(sample.diagnosticReason, "frame-gap");
	assert.equal(sample.totalMs, 375);
	assert.equal(sample.frameGapMs, 375);
	assert.equal(sample.maxEventLoopLagMs, 42);
	assert.match(sample.summary, /frameGap=375ms/);
	assert.match(sample.summary, /visibility=visible/);
});

test("browser performance debug reports periodic and lag samples", () => {
	let now = 0;
	const diagnostics = [];
	const timeouts = [];
	const frames = [];
	const windowRef = {
		document: { visibilityState: "visible" },
		setTimeout(callback) {
			timeouts.push(callback);
			return timeouts.length;
		},
		clearTimeout() {},
		requestAnimationFrame(callback) {
			frames.push(callback);
			return frames.length;
		},
		cancelAnimationFrame() {},
	};

	const monitor = startBrowserPerformanceDebug({
		windowRef,
		performanceRef: { now: () => now },
		postDiagnostic: (sample) => diagnostics.push(sample),
		intervalMs: 1000,
		eventLoopLagMs: 250,
		frameGapMs: 250,
		periodicReportMs: 15000,
	});

	assert.equal(diagnostics[0].diagnosticReason, "periodic");

	now = 1400;
	timeouts[0]();
	assert.equal(diagnostics.at(-1).diagnosticReason, "event-loop-lag");
	assert.equal(diagnostics.at(-1).eventLoopLagMs, 400);

	frames[0](0);
	frames[1](325);
	assert.equal(diagnostics.at(-1).diagnosticReason, "frame-gap");
	assert.equal(diagnostics.at(-1).frameGapMs, 325);

	monitor.stop();
});
