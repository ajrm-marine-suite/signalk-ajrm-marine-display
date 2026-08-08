/**
 * Controls the Profiles-menu anchoring action and its persistent chart marker.
 */

import { ajrmMarineAuthHeaders } from "./ajrm-marine-api-access.mjs";
import { AJRM_MARINE_UI_STATE_EVENT } from "./app-ui-state-publisher.mjs";

const ANCHOR_API = "/signalk/v1/api/ajrmMarineDisplay/anchor";

export function createAnchorController({
	L,
	map,
	controls,
	fetchFn = globalThis.fetch,
	windowObject = globalThis.window,
	onProfileChanged = async () => {},
}) {
	let marker = null;
	let markerSignature = "";
	let busy = false;
	let latestStatus = null;

	function init() {
		controls.drop.addEventListener("click", () => runAction("drop"));
		controls.clear.addEventListener("click", () => runAction("clear"));
		windowObject?.addEventListener?.(AJRM_MARINE_UI_STATE_EVENT, (event) => {
			render(event?.detail?.uiState?.anchor);
		});
		refresh();
	}

	async function refresh() {
		try {
			const response = await fetchFn(ANCHOR_API, {
				credentials: "include",
				cache: "no-store",
			});
			if (response?.ok) render(await response.json());
		} catch {
			setMessage("Anchor status unavailable", true);
		}
	}

	async function runAction(action) {
		if (busy) return;
		busy = true;
		renderButtons();
		setMessage(
			action === "drop" ? "Marking anchor position…" : "Un-anchoring…",
		);
		try {
			const response = await fetchFn(`${ANCHOR_API}/${action}`, {
				method: "POST",
				credentials: "include",
				headers: ajrmMarineAuthHeaders(),
			});
			const body = await response.json().catch(() => ({}));
			if (!response.ok)
				throw new Error(
					body.error || `Anchor action failed (${response.status})`,
				);
			render(body);
			await onProfileChanged();
		} catch (error) {
			setMessage(error.message || String(error), true);
		} finally {
			busy = false;
			renderButtons();
		}
	}

	function render(value) {
		if (!value || typeof value !== "object") return;
		latestStatus = value;
		renderMarker(value);
		renderButtons();
		if (value.active === true && validMark(value.mark)) {
			setMessage(
				`Anchor marked at ${formatDepth(value.mark.depthBelowKeelMeters)} below keel`,
			);
		} else if (value.currentProfile === "anchor") {
			setMessage("Anchored profile active; no anchor position marked");
		} else {
			setMessage("No anchor position marked");
		}
	}

	function renderButtons() {
		const active = latestStatus?.active === true;
		const anchored = latestStatus?.currentProfile === "anchor";
		controls.drop.hidden = active;
		controls.clear.hidden = !active && !anchored;
		controls.drop.disabled = busy;
		controls.clear.disabled = busy;
	}

	function renderMarker(value) {
		if (value.active !== true || !validMark(value.mark)) {
			removeMarker();
			return;
		}
		const mark = value.mark;
		const signature = JSON.stringify(mark);
		if (marker && signature === markerSignature) return;
		removeMarker();
		const depth = formatDepth(mark.depthBelowKeelMeters);
		const icon = L.divIcon({
			className: "ajrm-anchor-marker",
			html: `<span class="ajrm-anchor-symbol" aria-hidden="true">⚓</span><span class="ajrm-anchor-depth">${depth} below keel</span>`,
			iconSize: [120, 54],
			iconAnchor: [60, 20],
		});
		marker = L.marker([mark.position.latitude, mark.position.longitude], {
			icon,
			interactive: false,
			keyboard: false,
			zIndexOffset: 5000,
		}).addTo(map);
		markerSignature = signature;
	}

	function removeMarker() {
		if (marker) marker.removeFrom(map);
		marker = null;
		markerSignature = "";
	}

	function setMessage(message, error = false) {
		controls.status.textContent = message;
		controls.status.classList.toggle("text-danger", error);
	}

	return { init, refresh, render };
}

export function validMark(mark) {
	return (
		Number.isFinite(Number(mark?.position?.latitude)) &&
		Number.isFinite(Number(mark?.position?.longitude)) &&
		Number.isFinite(Number(mark?.depthBelowKeelMeters))
	);
}

export function formatDepth(value) {
	return `${Number(value).toFixed(1)} m`;
}
