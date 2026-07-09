const DEFAULT_POLL_INTERVAL_MS = 2000;
const CONTROLS_PATH = "/signalk/v1/api/ajrmMarineDisplay/debugControls";

const DEFAULT_CONTROLS = Object.freeze({
	markerUpdates: true,
	courseLines: true,
	footprints: true,
	labels: true,
	targetTable: true,
	autoCharts: true,
	harbourLayer: true,
});

let currentControls = { ...DEFAULT_CONTROLS };

export function displayDebugControls() {
	return currentControls;
}

export function setDisplayDebugControls(controls = {}) {
	currentControls = normalizeDisplayDebugControls(controls);
	return currentControls;
}

export function normalizeDisplayDebugControls(controls = {}) {
	return Object.fromEntries(
		Object.entries(DEFAULT_CONTROLS).map(([key, fallback]) => [
			key,
			controls[key] !== undefined ? controls[key] === true : fallback,
		]),
	);
}

export function startDisplayDebugControlPolling({
	windowRef = globalThis.window,
	fetchFn = globalThis.fetch,
	intervalMs = DEFAULT_POLL_INTERVAL_MS,
	controlsPath = CONTROLS_PATH,
} = {}) {
	if (!windowRef || typeof fetchFn !== "function") return null;
	let stopped = false;
	let timer = null;

	async function refresh() {
		try {
			const response = await fetchFn(`${controlsPath}?ts=${Date.now()}`, {
				credentials: "include",
				cache: "no-store",
				headers: { Accept: "application/json" },
			});
			if (!response.ok) return;
			const body = await response.json();
			const controls = setDisplayDebugControls(body.controls || body);
			windowRef.AJRM_MARINE_DISPLAY_DEBUG_CONTROLS = controls;
		} catch (_error) {
			// Diagnostics must never make the Display less usable.
		}
	}

	function schedule() {
		if (stopped) return;
		timer = windowRef.setTimeout?.(async () => {
			await refresh();
			schedule();
		}, intervalMs);
	}

	refresh();
	schedule();

	return {
		stop() {
			stopped = true;
			if (timer != null) windowRef.clearTimeout?.(timer);
		},
	};
}
