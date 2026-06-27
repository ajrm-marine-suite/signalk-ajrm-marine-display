import { ingestRawVesselData } from "./target-snapshot-ingest.mjs";
import {
	applyConnectionStatusControls,
	applyRefreshAttribution,
	shouldShowAlarmPopup,
	uiStateConnectionStatus,
} from "./app-refresh-state.mjs";
import { createRefreshDataFetcher } from "./app-refresh-data-fetcher.mjs";
import { applyTrafficTargetProjection } from "./traffic-target-projection.mjs";
import { applyDisplayTargetGeometry } from "./display-target-geometry.mjs";
import { publishUiStateToWindow } from "./app-ui-state-publisher.mjs";
import { uiStatePath } from "./ui-state-routes.mjs";
import { getTargetsPath } from "./target-silence-routes.mjs";

export function createAppRefreshController({
	pluginId = "signalk-ajrm-marine-display",
	map,
	getHttpResponse,
	targets,
	getSelfMmsi,
	setSelfTarget,
	targetSilence,
	serverAlertEvents,
	alertPopup,
	initialPluginTargets,
	updateUI,
	ageOutOldTargets,
	removeMissingTargets = () => {},
	resetTargetCounts,
	getAlarmTargetCount,
	targetMaxAge,
	ageOutEnabled,
	showAlarmsInterval,
	replayStatusControls,
	connectionStatusControls,
	publishUiState = publishUiStateToWindow,
	projectionFallbackEnabled = defaultProjectionFallbackEnabled,
}) {
	let lastAlarmTime;
	let lastSuccessfulConnectionAt = null;
	const { fetchRefreshVessels } = createRefreshDataFetcher({ getHttpResponse });

	async function refresh() {
		const startTime = new Date();
		let vessels;
		try {
			vessels = await fetchRefreshVessels();
			lastSuccessfulConnectionAt = startTime;
			applyConnectionStatusControls(connectionStatusControls, {
				connected: true,
				lastSuccessfulConnectionAt,
			});
		} catch (error) {
			applyConnectionStatusControls(connectionStatusControls, {
				connected: false,
				error,
				lastSuccessfulConnectionAt,
			});
			console.error("Error in refresh:", error);
			return;
		}

		try {
			const replayStatus = replayStatusFromSignalKVessels(vessels);
			applyReplayStatusControls(replayStatusControls, replayStatus);
			resetTargetCounts();
			const { removedMmsis } = ingestRawVesselData({
				vessels,
				targets,
				targetMaxAge,
				removeMissing: replayStatus.active === true,
			});
			if (removedMmsis.length > 0) removeMissingTargets(removedMmsis);
			applyDisplayTargetGeometry({
				targets,
				selfMmsi: getSelfMmsi(),
			});
			setSelfTarget(targets.get(getSelfMmsi()));

			const trafficTargets = await getHttpResponse(getTargetsPath(pluginId), {
				throwErrors: true,
				cache: "no-store",
			});
			applyTrafficTargetProjection({
				targets,
				projection: trafficTargets,
			});

			const uiState = await readUiState();
			const allowProjectionFallback = projectionFallbackEnabled();
			publishUiState(uiState);
			await serverAlertEvents.refresh({
				uiState,
				allowFallback: allowProjectionFallback,
			});
			targetSilence.applyInitialMuteData(trafficTargets || initialPluginTargets);
			updateUI({
				uiState,
				allowServerFallbackRefresh: allowProjectionFallback,
			});
			applyUiStateConnectionStatus(uiState);

			if (ageOutEnabled) {
				ageOutOldTargets();
			}

			const now = Date.now();
			if (
				shouldShowAlarmPopup({
					alarmCount: getAlarmTargetCount(),
					lastAlarmTime,
					now,
					showAlarmsInterval,
				})
			) {
				lastAlarmTime = now;
				alertPopup.show();
			}

			applyRefreshAttribution({ map, startTime });
		} catch (error) {
			console.error("Error in refresh:", error);
		}
	}

	async function readUiState() {
		try {
			return await getHttpResponse(uiStatePath(pluginId), {
				throwErrors: true,
			});
		} catch (error) {
			console.warn("Error refreshing AJRM Marine UI state:", error);
			return null;
		}
	}

	function applyUiStateConnectionStatus(uiState) {
		if (!connectionStatusControls) return;
		const status = uiStateConnectionStatus(uiState, {
			lastSuccessfulConnectionAt,
		});
		if (status) applyConnectionStatusControls(connectionStatusControls, status);
	}

	return { refresh };
}

export function defaultProjectionFallbackEnabled() {
	const windowObject = globalThis.window;
	return (
		windowObject?.AJRM_MARINE_DEBUG === true ||
		windowObject?.localStorage?.getItem?.("ajrmMarineDebug") === "true"
	);
}

export function replayStatusFromAjrmMarineLogger(status) {
	const playback = status?.playback;
	return replayStatusFromPlaybackValue(playback);
}

export function replayStatusFromSignalKVessels(vessels) {
	const playback = ajrmMarineLoggerPlaybackFromSignalKVessels(vessels);
	return replayStatusFromPlaybackValue(playback);
}

export function ajrmMarineLoggerPlaybackFromSignalKVessels(vessels) {
	if (!vessels || typeof vessels !== "object") return null;
	for (const vessel of Object.values(vessels)) {
		const playback = vessel?.plugins?.ajrmMarineLogger?.playback;
		if (playback !== undefined && playback !== null) {
			return signalKValue(playback);
		}
	}
	return null;
}

function signalKValue(pathValue) {
	if (
		pathValue &&
		typeof pathValue === "object" &&
		Object.hasOwn(pathValue, "value")
	) {
		return pathValue.value;
	}
	return pathValue;
}

function replayStatusFromPlaybackValue(playback) {
	if (!playback || (playback.active !== true && playback.paused !== true)) {
		return { active: false };
	}

	const current = playback.current || playback.capturedAt || null;
	const replayTimeMs = Date.parse(current);
	return {
		active: Number.isFinite(replayTimeMs),
		current,
		fileName: playback.fileName || null,
		paused: playback.paused === true || playback.playing === false,
		rate: Number.isFinite(Number(playback.rate)) ? Number(playback.rate) : null,
		replayTimeMs: Number.isFinite(replayTimeMs) ? replayTimeMs : null,
	};
}

export function applyReplayStatusControls(controls, replayStatus) {
	const resolvedControls = resolveReplayStatusControls(controls);
	if (!resolvedControls?.status) return;
	const active = replayStatus?.active === true;
	const modeText = active ? "Replay" : "";
	const timeText = active ? replayStatusDisplayTime(replayStatus) : "";
	const fileText = active ? replayStatusDetailText(replayStatus) : "";
	const signature = replayStatusControlsSignature({
		active,
		modeText,
		timeText,
		fileText,
	});
	if (resolvedControls.status._ajrmMarineReplayStatusSignature === signature) {
		return false;
	}
	resolvedControls.status._ajrmMarineReplayStatusSignature = signature;
	resolvedControls.status.classList.toggle("d-none", !active);
	resolvedControls.status.classList.toggle("ajrm-marine-replay-status-live", !active);
	resolvedControls.status.classList.toggle("ajrm-marine-replay-status-active", active);
	if (resolvedControls.mode) {
		resolvedControls.mode.textContent = modeText;
	}
	if (resolvedControls.time) {
		resolvedControls.time.textContent = timeText;
	}
	if (resolvedControls.file) {
		resolvedControls.file.textContent = fileText;
	}
	return true;
}

export function replayStatusControlsSignature({
	active,
	modeText,
	timeText,
	fileText,
}) {
	return [
		active ? "1" : "0",
		modeText || "",
		timeText || "",
		fileText || "",
	].join("\u001f");
}

export function resolveReplayStatusControls(controls) {
	if (typeof document === "undefined") return controls;
	return {
		status: document.getElementById("replayStatus") || controls?.status || null,
		mode: document.getElementById("replayStatusMode") || controls?.mode || null,
		time: document.getElementById("replayStatusTime") || controls?.time || null,
		file: document.getElementById("replayStatusFile") || controls?.file || null,
	};
}

export function replayStatusDisplayTime(replayStatus) {
	if (!Number.isFinite(replayStatus?.replayTimeMs)) return "";
	return new Date(replayStatus.replayTimeMs).toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

export function replayStatusDetailText(replayStatus) {
	const details = [];
	if (replayStatus?.paused === true) {
		details.push("paused");
	}
	if (Number.isFinite(replayStatus?.rate)) {
		details.push(`${replayStatus.rate}x`);
	}
	if (replayStatus?.fileName) {
		details.push(replayStatus.fileName);
	}
	return details.join(" · ");
}
