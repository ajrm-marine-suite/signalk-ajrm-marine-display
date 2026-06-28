const DEFAULT_STATUS_URL = "/plugins/signalk-ajrm-marine-gps-integrity/status";
const DEFAULT_FALLBACK_STATUS_URL = "/signalk/v1/api/vessels/self";
const DEFAULT_FALLBACK_MAX_AGE_MS = 30_000;

export function createGpsStatusIndicator({
	element,
	textElement,
	fetchFn = globalThis.fetch,
	windowObject = globalThis.window,
	statusUrl = DEFAULT_STATUS_URL,
	fallbackStatusUrl = DEFAULT_FALLBACK_STATUS_URL,
	intervalMs = 3000,
	timeoutMs = 2500,
	fallbackMaxAgeMs = DEFAULT_FALLBACK_MAX_AGE_MS,
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
			const primary = await fetchJson({
				fetchFn,
				url: statusUrl,
				controller,
			});
			if (primary.ok) {
				render(classifyGpsStatus(primary.data));
				return;
			}

			const fallback = await fetchJson({
				fetchFn,
				url: fallbackStatusUrl,
				controller,
			});
			if (!fallback.ok) {
				throw new Error(fallback.error || "GPS status unavailable");
			}
			render(classifySignalKGpsStatus(fallback.data, {
				now: Date.now(),
				maxAgeMs: fallbackMaxAgeMs,
			}));
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

	async function fetchJson({ fetchFn, url, controller }) {
		try {
			const response = await fetchFn(`${url}?ts=${Date.now()}`, {
				credentials: "include",
				cache: "no-store",
				headers: { Accept: "application/json" },
				signal: controller.signal,
			});
			if (!response.ok) {
				return { ok: false, error: `HTTP ${response.status}` };
			}
			return { ok: true, data: await response.json() };
		} catch (error) {
			return { ok: false, error: error?.message || String(error) };
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

export function classifySignalKGpsStatus(data, {
	now = Date.now(),
	maxAgeMs = DEFAULT_FALLBACK_MAX_AGE_MS,
} = {}) {
	const position = signalKValue(data?.navigation?.position);
	if (!isFinitePosition(position)) {
		return {
			kind: "alert",
			label: "GPS LOST",
			title: "GPS position is missing or invalid",
		};
	}

	const timestamp = Date.parse(data?.navigation?.position?.timestamp || "");
	if (Number.isFinite(timestamp) && now - timestamp > maxAgeMs) {
		return {
			kind: "alert",
			label: "GPS STALE",
			title: "GPS position is stale",
		};
	}

	const quality = signalKValue(data?.navigation?.gnss?.methodQuality);
	const satellites = Number(signalKValue(data?.navigation?.gnss?.satellites));
	const titleParts = ["GPS received OK"];
	if (quality) titleParts.push(String(quality));
	if (Number.isFinite(satellites)) {
		titleParts.push(`${satellites} satellites`);
	}

	return {
		kind: "ok",
		label: "GPS OK",
		title: titleParts.join(" - "),
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

function signalKValue(value) {
	if (
		value &&
		typeof value === "object" &&
		Object.hasOwn(value, "value")
	) {
		return signalKValue(value.value);
	}
	return value;
}

function isFinitePosition(position) {
	return (
		Number.isFinite(Number(position?.latitude)) &&
		Number.isFinite(Number(position?.longitude))
	);
}
