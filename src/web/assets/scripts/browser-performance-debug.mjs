const DEFAULT_INTERVAL_MS = 1000;
const DEFAULT_EVENT_LOOP_LAG_MS = 250;
const DEFAULT_FRAME_GAP_MS = 250;
const DEFAULT_PERIODIC_REPORT_MS = 15000;

export function startBrowserPerformanceDebug({
	windowRef = globalThis.window,
	performanceRef = globalThis.performance,
	postDiagnostic,
	intervalMs = DEFAULT_INTERVAL_MS,
	eventLoopLagMs = DEFAULT_EVENT_LOOP_LAG_MS,
	frameGapMs = DEFAULT_FRAME_GAP_MS,
	periodicReportMs = DEFAULT_PERIODIC_REPORT_MS,
} = {}) {
	if (!windowRef || typeof postDiagnostic !== "function") return null;
	let stopped = false;
	let timer = null;
	let rafId = null;
	let lastTickAt = now(performanceRef);
	let expectedTickAt = lastTickAt + intervalMs;
	let lastFrameAt = null;
	let lastReportAt = Number.NEGATIVE_INFINITY;
	let maxEventLoopLag = 0;
	let maxFrameGap = 0;

	function report(reason, extra = {}) {
		const current = now(performanceRef);
		if (reason === "periodic" && current - lastReportAt < periodicReportMs) return;
		lastReportAt = current;
		const sample = browserPerformanceSample({
			reason,
			maxEventLoopLag,
			maxFrameGap,
			windowRef,
			...extra,
		});
		postDiagnostic(sample);
		if (reason === "periodic") {
			maxEventLoopLag = 0;
			maxFrameGap = 0;
		}
	}

	function tick() {
		if (stopped) return;
		const current = now(performanceRef);
		const lag = Math.max(0, Math.round(current - expectedTickAt));
		maxEventLoopLag = Math.max(maxEventLoopLag, lag);
		if (lag >= eventLoopLagMs) report("event-loop-lag", { eventLoopLagMs: lag });
		report("periodic");
		lastTickAt = current;
		expectedTickAt = current + intervalMs;
		timer = windowRef.setTimeout?.(tick, intervalMs);
	}

	function frame(current) {
		if (stopped) return;
		if (lastFrameAt != null) {
			const gap = Math.max(0, Math.round(current - lastFrameAt));
			maxFrameGap = Math.max(maxFrameGap, gap);
			if (gap >= frameGapMs) report("frame-gap", { frameGapMs: gap });
		}
		lastFrameAt = current;
		rafId = windowRef.requestAnimationFrame?.(frame) ?? null;
	}

	timer = windowRef.setTimeout?.(tick, intervalMs) ?? null;
	rafId = windowRef.requestAnimationFrame?.(frame) ?? null;
	report("periodic");

	return {
		stop() {
			stopped = true;
			if (timer != null) windowRef.clearTimeout?.(timer);
			if (rafId != null) windowRef.cancelAnimationFrame?.(rafId);
		},
	};
}

export function browserPerformanceSample({
	reason,
	eventLoopLagMs = 0,
	frameGapMs = 0,
	maxEventLoopLag = eventLoopLagMs,
	maxFrameGap = frameGapMs,
	windowRef = globalThis.window,
}) {
	const totalMs = Math.max(
		Number(eventLoopLagMs) || 0,
		Number(frameGapMs) || 0,
		Number(maxEventLoopLag) || 0,
		Number(maxFrameGap) || 0,
	);
	const visibilityState = windowRef?.document?.visibilityState || "";
	return {
		diagnosticType: "browser-performance",
		diagnosticReason: reason,
		totalMs,
		eventLoopLagMs: Math.round(Number(eventLoopLagMs) || 0),
		frameGapMs: Math.round(Number(frameGapMs) || 0),
		maxEventLoopLagMs: Math.round(Number(maxEventLoopLag) || 0),
		maxFrameGapMs: Math.round(Number(maxFrameGap) || 0),
		visibilityState,
		startedAt: new Date().toISOString(),
		finishedAt: new Date().toISOString(),
		summary: [
			`reason=${reason}`,
			`eventLoopLag=${Math.round(Number(eventLoopLagMs) || 0)}ms`,
			`frameGap=${Math.round(Number(frameGapMs) || 0)}ms`,
			`maxEventLoopLag=${Math.round(Number(maxEventLoopLag) || 0)}ms`,
			`maxFrameGap=${Math.round(Number(maxFrameGap) || 0)}ms`,
			visibilityState ? `visibility=${visibilityState}` : "",
		].filter(Boolean).join("; "),
		counts: {},
	};
}

function now(performanceRef) {
	return performanceRef?.now?.() ?? Date.now();
}
