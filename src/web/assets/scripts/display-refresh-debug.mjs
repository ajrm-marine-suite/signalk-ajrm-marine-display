const DEFAULT_HISTORY_LIMIT = 120;
const DEFAULT_SLOW_REFRESH_MS = 750;
const DEFAULT_REPORT_INTERVAL_MS = 15000;

export function createDisplayRefreshDebug({
	windowRef = globalThis.window,
	performanceRef = globalThis.performance,
	consoleRef = globalThis.console,
	historyLimit = DEFAULT_HISTORY_LIMIT,
	slowRefreshMs = DEFAULT_SLOW_REFRESH_MS,
	reportIntervalMs = DEFAULT_REPORT_INTERVAL_MS,
	postDiagnostic = createRefreshDiagnosticPoster({ windowRef, consoleRef }),
} = {}) {
	const history = [];
	let lastSlowReportAt = Number.NEGATIVE_INFINITY;

	function now() {
		return performanceRef?.now?.() ?? Date.now();
	}

	function enabled() {
		return (
			windowRef?.AJRM_MARINE_DISPLAY_DEBUG === true ||
			windowRef?.localStorage?.getItem?.("ajrmMarineDisplayDebug") === "true"
		);
	}

	function start() {
		const sample = {
			startedAt: new Date().toISOString(),
			startMs: now(),
			phases: {},
			counts: {},
		};
		return {
			phase(name, fn) {
				return measurePhase({ sample, name, fn, now });
			},
			finish(extra = {}) {
				return finishSample({
					sample,
					extra,
					now,
					history,
					historyLimit,
					slowRefreshMs,
					reportIntervalMs,
					enabled: enabled(),
					consoleRef,
					windowRef,
					postDiagnostic,
					getLastSlowReportAt: () => lastSlowReportAt,
					setLastSlowReportAt: (value) => {
						lastSlowReportAt = value;
					},
				});
			},
		};
	}

	function snapshot() {
		return {
			enabled: enabled(),
			last: history.at(-1) || null,
			history: history.slice(),
		};
	}

	if (windowRef) {
		const api = {
			enable() {
				windowRef.localStorage?.setItem?.("ajrmMarineDisplayDebug", "true");
				windowRef.AJRM_MARINE_DISPLAY_DEBUG = true;
				return snapshot();
			},
			disable() {
				windowRef.localStorage?.removeItem?.("ajrmMarineDisplayDebug");
				windowRef.AJRM_MARINE_DISPLAY_DEBUG = false;
				return snapshot();
			},
			last() {
				return history.at(-1) || null;
			},
			snapshot,
		};
		exposeWindowDebugValue(windowRef, "AJRMMarineDisplayDebug", api);
		exposeWindowDebugValue(windowRef, "ajrmMarineDisplayRefreshStats", snapshot);
		exposeWindowDebugValue(windowRef, "ajrmMarineDisplayDebug", snapshot);
	}

	return { enabled, start, snapshot };
}

function exposeWindowDebugValue(windowRef, name, value) {
	try {
		Object.defineProperty(windowRef, name, {
			value,
			configurable: true,
			writable: true,
		});
	} catch (_error) {
		windowRef[name] = value;
	}
}

function measurePhase({ sample, name, fn, now }) {
	const started = now();
	try {
		const result = fn();
		if (result && typeof result.then === "function") {
			return result.finally(() => {
				sample.phases[name] = Math.round(now() - started);
			});
		}
		sample.phases[name] = Math.round(now() - started);
		return result;
	} finally {
		if (!Object.hasOwn(sample.phases, name)) {
			sample.phases[name] = Math.round(now() - started);
		}
	}
}

function finishSample({
	sample,
	extra,
	now,
	history,
	historyLimit,
	slowRefreshMs,
	reportIntervalMs,
	enabled,
	windowRef,
	postDiagnostic,
	getLastSlowReportAt,
	setLastSlowReportAt,
}) {
	const totalMs = Math.round(now() - sample.startMs);
	const finishedAtMs = now();
	const finished = {
		...sample,
		...extra,
		totalMs,
		finishedAt: new Date().toISOString(),
	};
	finished.slowestPhases = slowestPhases(finished.phases);
	finished.summary = refreshDebugSummary(finished);
	delete finished.startMs;
	history.push(finished);
	while (history.length > historyLimit) history.shift();
	if (windowRef) windowRef.ajrmMarineDisplayLastRefresh = finished;
	if (
		enabled &&
		totalMs >= slowRefreshMs &&
		finishedAtMs - (getLastSlowReportAt?.() || 0) >= reportIntervalMs
	) {
		setLastSlowReportAt?.(finishedAtMs);
		postDiagnostic?.(finished);
	}
	return finished;
}

export function createRefreshDiagnosticPoster({
	windowRef = globalThis.window,
	consoleRef = globalThis.console,
} = {}) {
	return (sample) => {
		if (!windowRef?.fetch) return;
		const payload = JSON.stringify({
			contract: "ajrm-marine-display-refresh-diagnostic",
			contractVersion: 1,
			sample,
			userAgent: windowRef.navigator?.userAgent || "",
		});
		windowRef
			.fetch("/signalk/v1/api/ajrmMarineDisplay/refreshDiagnostics", {
				method: "POST",
				credentials: "include",
				cache: "no-store",
				keepalive: true,
				headers: { "Content-Type": "application/json" },
				body: payload,
			})
			.catch((error) => {
				consoleRef?.debug?.(
					"AJRM Marine Display refresh diagnostic write failed",
					error,
				);
			});
	};
}

export function slowestPhases(phases = {}, limit = 5) {
	return Object.entries(phases)
		.map(([name, ms]) => ({ name, ms: Number(ms) || 0 }))
		.sort((left, right) => right.ms - left.ms)
		.slice(0, limit);
}

export function refreshDebugSummary(sample = {}) {
	const phaseText = (sample.slowestPhases || slowestPhases(sample.phases))
		.map((phase) => `${phase.name}=${phase.ms}ms`)
		.join(", ");
	const counts = sample.counts || {};
	return [
		`total=${sample.totalMs || 0}ms`,
		phaseText ? `slowest: ${phaseText}` : "",
		`targets=${counts.targets ?? "?"}`,
		`markers=${counts.boatMarkers ?? "?"}`,
		`layers=${counts.layerCount ?? "?"}`,
		`replay=${sample.replayActive === true ? "active" : "off"}`,
	].filter(Boolean).join("; ");
}
