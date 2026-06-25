import {
	connectionHintsUiStateProjection,
	dataHealthUiStateProjection,
} from "./ui-state-projection-reader.mjs";

export function shouldShowAlarmPopup({
	alarmCount,
	lastAlarmTime,
	now,
	showAlarmsInterval,
}) {
	return (
		alarmCount > 0 &&
		(lastAlarmTime == null || now > lastAlarmTime + showAlarmsInterval)
	);
}

export function refreshAttributionText({ updateTimeMs, layerCount }) {
	return `${updateTimeMs} msecs / ${layerCount} layers`;
}

const mapLayerCountCache = new WeakMap();

export function countMapLayers(map, { now = Date.now(), maxAgeMs = 0 } = {}) {
	const cached = mapLayerCountCache.get(map);
	if (maxAgeMs > 0 && cached && now - cached.now <= maxAgeMs) {
		return cached.count;
	}
	let layers = 0;
	map.eachLayer(() => {
		layers++;
	});
	mapLayerCountCache.set(map, { count: layers, now });
	return layers;
}

export function resetMapLayerCountCache(map) {
	if (map) mapLayerCountCache.delete(map);
}

export function applyRefreshAttribution({
	map,
	startTime,
	now = Date.now(),
	layerCountMaxAgeMs = 1000,
}) {
	map.attributionControl.setPrefix(
		refreshAttributionText({
			updateTimeMs: now - startTime.getTime(),
			layerCount: countMapLayers(map, { now, maxAgeMs: layerCountMaxAgeMs }),
		}),
	);
}

export function connectionLostDetailText({ lastSuccessfulConnectionAt } = {}) {
	const lastUpdate = lastSuccessfulConnectionTime(lastSuccessfulConnectionAt);
	const base = "Showing last received chart and vessel data.";
	return lastUpdate ? `${base} Last update ${lastUpdate}.` : base;
}

export function uiStateConnectionStatus(
	uiState,
	{ lastSuccessfulConnectionAt, now = Date.now() } = {},
) {
	if (!uiState || typeof uiState !== "object" || Array.isArray(uiState)) {
		return {
			connected: false,
			mode: "AJRM Marine status unavailable",
			detail:
				"Chart and vessel display remain available; alert and status panels may be stale.",
			lastSuccessfulConnectionAt,
		};
	}
	const dataHealth = dataHealthUiStateProjection(uiState) || {};
	const connectionHints = connectionHintsUiStateProjection(uiState) || {};
	const staleServerData = isUiStateServerDataStale(uiState, {
		connectionHints,
		now,
	});
	if (staleServerData) {
		return {
			connected: false,
			mode: "Signal K data stale",
			detail:
				connectionHints.staleMessage ||
				connectionLostDetailText({ lastSuccessfulConnectionAt }),
			lastSuccessfulConnectionAt,
		};
	}
	if (dataHealth.healthy === false) {
		return {
			connected: false,
			mode:
				dataHealth.state === "stale"
					? "GPS data stale"
					: "GPS data unavailable",
			detail:
				dataHealth.message ||
				connectionLostDetailText({ lastSuccessfulConnectionAt }),
			lastSuccessfulConnectionAt,
		};
	}
	return { connected: true, lastSuccessfulConnectionAt };
}

export function applyConnectionStatusControls(controls, connectionStatus = {}) {
	const resolvedControls = resolveConnectionStatusControls(controls);
	if (!resolvedControls?.status) return;
	const disconnected = connectionStatus.connected === false;
	const modeText = disconnected
		? connectionStatus.mode || "Pi connection lost"
		: "";
	const detailText = disconnected
		? connectionStatus.detail || connectionLostDetailText(connectionStatus)
		: "";
	const signature = connectionStatusControlsSignature({
		disconnected,
		modeText,
		detailText,
	});
	if (resolvedControls.status._aisPlusConnectionStatusSignature === signature) {
		return false;
	}
	resolvedControls.status._aisPlusConnectionStatusSignature = signature;
	resolvedControls.status.classList.toggle("d-none", !disconnected);
	if (resolvedControls.mode) {
		resolvedControls.mode.textContent = modeText;
	}
	if (resolvedControls.detail) {
		resolvedControls.detail.textContent = detailText;
	}
	return true;
}

export function connectionStatusControlsSignature({
	disconnected,
	modeText,
	detailText,
}) {
	return [
		disconnected ? "1" : "0",
		modeText || "",
		detailText || "",
	].join("\u001f");
}

export function resolveConnectionStatusControls(controls) {
	if (typeof document === "undefined") return controls;
	return {
		status:
			document.getElementById("connectionStatus") ||
			controls?.status ||
			null,
		mode:
			document.getElementById("connectionStatusMode") ||
			controls?.mode ||
			null,
		detail:
			document.getElementById("connectionStatusDetail") ||
			controls?.detail ||
			null,
	};
}

function lastSuccessfulConnectionTime(lastSuccessfulConnectionAt) {
	if (!(lastSuccessfulConnectionAt instanceof Date)) return "";
	if (!Number.isFinite(lastSuccessfulConnectionAt.getTime())) return "";
	return lastSuccessfulConnectionAt.toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

function isUiStateServerDataStale(
	uiState,
	{ connectionHints = {}, now = Date.now() } = {},
) {
	const generatedAt = new Date(
		connectionHints.generatedAt || uiState.serverTime || "",
	).getTime();
	const staleAfterSeconds = Number(connectionHints.staleAfterSeconds);
	if (
		!Number.isFinite(generatedAt) ||
		!Number.isFinite(staleAfterSeconds) ||
		staleAfterSeconds <= 0
	) {
		return false;
	}
	return now - generatedAt > staleAfterSeconds * 1000;
}
