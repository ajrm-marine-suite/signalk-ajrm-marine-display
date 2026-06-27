const DEFAULT_STATUS_URL = "/plugins/signalk-ajrm-marine-gps-integrity/status";

export function createGpsStatusIndicator({
	element,
	textElement,
	fetchFn = globalThis.fetch,
	windowObject = globalThis.window,
	statusUrl = DEFAULT_STATUS_URL,
	intervalMs = 3000,
	timeoutMs = 2500,
}) {
	let stopped = false;
	let timer = null;

	function render(status) {
		element.classList.remove(
			"ajrm-marine-gps-status-ok",
			"ajrm-marine-gps-status-alert",
			"ajrm-marine-gps-status-unknown",
		);
		element.classList.add(`ajrm-marine-gps-status-${status.kind}`);
		textElement.textContent = status.label;
		element.title = status.title;
	}

	async function pollOnce() {
		const controller = new AbortController();
		const timeout = windowObject.setTimeout(() => controller.abort(), timeoutMs);
		try {
			const response = await fetchFn(`${statusUrl}?ts=${Date.now()}`, {
				credentials: "include",
				cache: "no-store",
				headers: { Accept: "application/json" },
				signal: controller.signal,
			});
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			render(classifyGpsStatus(await response.json()));
		} catch (_err) {
			render({
				kind: "unknown",
				label: "GPS ?",
				title: "GPS status unavailable",
			});
		} finally {
			windowObject.clearTimeout(timeout);
		}
	}

	function schedule() {
		if (stopped) return;
		timer = windowObject.setTimeout(async () => {
			await pollOnce();
			schedule();
		}, intervalMs);
	}

	return {
		start() {
			if (stopped) return;
			void pollOnce();
			schedule();
		},
		stop() {
			stopped = true;
			if (timer) {
				windowObject.clearTimeout(timer);
			}
		},
	};
}

export function classifyGpsStatus(data) {
	const state = data?.state || {};
	const gps = state.gps || {};
	const trust = String(state.trust || "").toLowerCase();
	if (gps.fixValid === false || trust === "lost" || trust === "unavailable") {
		return {
			kind: "alert",
			label: "GPS LOST",
			title: "GPS position is missing or invalid",
		};
	}
	if (
		gps.fixValid === true &&
		["normal", "trusted", "ok", "accepted"].includes(trust)
	) {
		return {
			kind: "ok",
			label: "GPS OK",
			title: "GPS received OK",
		};
	}
	if (trust) {
		return {
			kind: "alert",
			label: "GPS ALERT",
			title: `GPS integrity state: ${trust}`,
		};
	}
	return {
		kind: "unknown",
		label: "GPS ?",
		title: "GPS status unknown",
	};
}
