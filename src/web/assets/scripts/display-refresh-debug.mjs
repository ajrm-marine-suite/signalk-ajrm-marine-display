const DEFAULT_HISTORY_LIMIT = 120;
const DEFAULT_SLOW_REFRESH_MS = 750;

export function createDisplayRefreshDebug({
	windowRef = globalThis.window,
	performanceRef = globalThis.performance,
	consoleRef = globalThis.console,
	historyLimit = DEFAULT_HISTORY_LIMIT,
	slowRefreshMs = DEFAULT_SLOW_REFRESH_MS,
} = {}) {
	const history = [];

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
					enabled: enabled(),
					consoleRef,
					windowRef,
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
	enabled,
	consoleRef,
	windowRef,
}) {
	const totalMs = Math.round(now() - sample.startMs);
	const finished = {
		...sample,
		...extra,
		totalMs,
		finishedAt: new Date().toISOString(),
	};
	delete finished.startMs;
	history.push(finished);
	while (history.length > historyLimit) history.shift();
	if (windowRef) windowRef.ajrmMarineDisplayLastRefresh = finished;
	if (enabled && totalMs >= slowRefreshMs) {
		consoleRef?.warn?.("[AJRM Marine Display] slow refresh", finished);
	}
	return finished;
}
