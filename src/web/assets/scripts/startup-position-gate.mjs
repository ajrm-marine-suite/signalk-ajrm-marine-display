/**
 * Waits for the first usable fresh or retained own-vessel position before
 * revealing the startup map.
 */

import { isOwnPositionLastKnown } from "./own-position-freshness.mjs";

export const DEFAULT_STARTUP_POSITION_TIMEOUT_MS = 15000;

export function createStartupPositionGate({
	map,
	getSelfTarget,
	subscribeSelfTarget,
	onWaiting = () => {},
	onResolved = () => {},
	onUnavailable = () => {},
	setDisableMoveend = () => {},
	timeoutMs = DEFAULT_STARTUP_POSITION_TIMEOUT_MS,
	setTimeoutFn = globalThis.setTimeout,
	clearTimeoutFn = globalThis.clearTimeout,
}) {
	if (!map || typeof map.setView !== "function") {
		throw new TypeError("Startup position gate requires a Leaflet map");
	}
	if (typeof getSelfTarget !== "function") {
		throw new TypeError("Startup position gate requires getSelfTarget");
	}
	if (typeof subscribeSelfTarget !== "function") {
		throw new TypeError("Startup position gate requires subscribeSelfTarget");
	}

	let state = "idle";
	let unsubscribe = null;
	let timeoutId = null;

	function start() {
		if (state !== "idle") return false;
		state = "waiting";
		onWaiting({ state });

		unsubscribe = subscribeSelfTarget(resolveTarget);
		if (resolveTarget(getSelfTarget())) return true;

		timeoutId = setTimeoutFn(markUnavailable, normalizedTimeout(timeoutMs));
		return true;
	}

	function stop() {
		if (state === "stopped" || state === "resolved") return false;
		clearTimer();
		unsubscribe?.();
		unsubscribe = null;
		state = "stopped";
		return true;
	}

	function resolveTarget(target) {
		if (state !== "waiting" && state !== "unavailable") return false;
		const position = currentVesselPosition(target);
		if (!position) return false;

		clearTimer();
		unsubscribe?.();
		unsubscribe = null;
		try {
			setDisableMoveend(true);
			centerMapOnPosition(map, position);
		} finally {
			setDisableMoveend(false);
		}
		const previousState = state;
		state = "resolved";
		onResolved({
			state,
			previousState,
			position,
			positionSource: position.positionSource,
			isLastKnown: position.isLastKnown,
			target,
		});
		return true;
	}

	function markUnavailable() {
		if (state !== "waiting") return;
		timeoutId = null;
		state = "unavailable";
		onUnavailable({
			state,
			reason: "timeout",
			timeoutMs: normalizedTimeout(timeoutMs),
		});
	}

	function clearTimer() {
		if (timeoutId === null) return;
		clearTimeoutFn(timeoutId);
		timeoutId = null;
	}

	return {
		start,
		stop,
		getState: () => state,
	};
}

export function currentVesselPosition(target, freshnessOptions = {}) {
	if (!target || target.isValid === false) {
		return null;
	}

	const latitude = finiteCoordinate(target.latitude);
	const longitude = finiteCoordinate(target.longitude);
	if (
		latitude === null ||
		longitude === null ||
		latitude < -90 ||
		latitude > 90 ||
		longitude < -180 ||
		longitude > 180
	) {
		return null;
	}

	const isLastKnown = isOwnPositionLastKnown(target, freshnessOptions);
	return {
		latitude,
		longitude,
		isLastKnown,
		positionSource: isLastKnown ? "last-known" : "fresh",
	};
}

export function centerMapOnPosition(map, position) {
	const zoom = Number(map.getZoom?.());
	map.setView(
		[position.latitude, position.longitude],
		Number.isFinite(zoom) ? zoom : undefined,
		{ animate: false },
	);
}

export function applyStartupChartDecision({
	positionState,
	updateAutoCharts = false,
	autoCharts,
	map,
	documentRef = globalThis.document,
	windowRef = globalThis.window,
	cover = documentRef?.getElementById?.("displayPositionGate"),
}) {
	if (updateAutoCharts) autoCharts.update();
	documentRef?.body?.classList?.remove("ajrm-marine-position-pending");
	if (documentRef?.body?.dataset) {
		documentRef.body.dataset.ajrmMarinePositionState = positionState;
	}
	if (cover) cover.hidden = true;
	windowRef?.requestAnimationFrame?.(() =>
		map?.invalidateSize?.({ animate: false }),
	);
}

function finiteCoordinate(value) {
	if (value === null || value === undefined || value === "") return null;
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

function normalizedTimeout(value) {
	const number = Number(value);
	return Number.isFinite(number) && number >= 0
		? number
		: DEFAULT_STARTUP_POSITION_TIMEOUT_MS;
}
