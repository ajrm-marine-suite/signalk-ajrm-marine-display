/**
 * Displays shared AJRM locations and Tide Resolver output without duplicating
 * station selection, provider access or tidal calculations in the browser.
 */

import {
	ajrmMarineAuthHeaders,
	assertAjrmMarineResponseAllowed,
} from "./ajrm-marine-api-access.mjs";

const LOCATION_API = "/plugins/signalk-ajrm-marine-location-editor";
const STORAGE = {
	anchorages: "ajrmMarineDisplay.showAnchorages",
	locations: "ajrmMarineDisplay.showLocations",
	status: "ajrmMarineDisplay.showTideStatus",
};
const ANCHORAGE_TYPES = new Set(["anchorage", "mooring"]);
const PORT_TYPES = new Set(["tidalStandardPort", "tidalSecondaryPort"]);

export const TIDE_SELECTION_LABELS = Object.freeze({
	explicitTideLocationRef: "Explicit tidal port assigned to this location",
	containingRegionAssignment: "Tidal port assigned to the containing tidal region",
	nearestPortInTidalRegion: "Nearest suitable port in the same tidal region",
	manualPinnedOverride: "Manually pinned alternative port",
	none: "No suitable tidal port selected",
});

function escapeHtml(value) {
	return String(value ?? "").replace(/[&<>"']/g, (character) => ({
		"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
	})[character]);
}

function readFlag(storage, key, fallback) {
	const value = storage?.getItem?.(key);
	return value == null ? fallback : value === "true";
}

function writeFlag(storage, key, value) {
	storage?.setItem?.(key, String(Boolean(value)));
}

function locationPosition(location) {
	const geometry = location?.feature?.geometry;
	if (geometry?.type === "Point") return [Number(geometry.coordinates[1]), Number(geometry.coordinates[0])];
	const ring = geometry?.type === "Polygon" ? geometry.coordinates?.[0] || [] : [];
	if (!ring.length) return null;
	return [
		ring.reduce((sum, point) => sum + Number(point[1]), 0) / ring.length,
		ring.reduce((sum, point) => sum + Number(point[0]), 0) / ring.length,
	];
}

function locationSymbol(location) {
	if (location.types.includes("anchorage")) return "⚓";
	if (location.types.includes("mooring")) return "●";
	if (location.types.includes("marina")) return "M";
	if (location.types.includes("harbour")) return "H";
	if (location.types.some((type) => PORT_TYPES.has(type))) return "↕";
	if (location.types.includes("tidalGate")) return "≈";
	if (location.types.includes("hazard") || location.types.includes("avoidanceArea")) return "!";
	return "•";
}

function popupHtml(location) {
	const tide = location.properties?.tide;
	const anchorage = location.properties?.anchorage;
	return `<div class="ajrm-location-popup">
		<strong>${escapeHtml(location.name)}</strong>
		<div>${escapeHtml(location.types.join(", "))}</div>
		${location.description ? `<p>${escapeHtml(location.description)}</p>` : ""}
		${anchorage?.seabed ? `<div>Seabed: ${escapeHtml(anchorage.seabed)}</div>` : ""}
		${Number.isFinite(Number(anchorage?.chartedDepthM)) ? `<div>Charted depth: ${Number(anchorage.chartedDepthM).toFixed(1)} m</div>` : ""}
		${tide?.stationName || tide?.stationId ? `<div>Tide station: ${escapeHtml(tide.stationName || tide.stationId)}</div>` : ""}
	</div>`;
}

function timeLabel(value) {
	if (!value || Number.isNaN(Date.parse(value))) return "—";
	return new Intl.DateTimeFormat(undefined, {
		weekday: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
	}).format(new Date(value));
}

function heightLabel(value) {
	return Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)} m` : "—";
}

function eventPoints(events) {
	const normalized = (events || []).filter((event) =>
		Number.isFinite(Number(event?.heightM)) && !Number.isNaN(Date.parse(event?.at)),
	).sort((left, right) => Date.parse(left.at) - Date.parse(right.at));
	const samples = [];
	for (let index = 0; index < normalized.length - 1; index += 1) {
		const before = normalized[index];
		const after = normalized[index + 1];
		for (let step = 0; step < 16; step += 1) {
			const fraction = step / 16;
			const progress = (1 - Math.cos(Math.PI * fraction)) / 2;
			samples.push({
				at: Date.parse(before.at) + (Date.parse(after.at) - Date.parse(before.at)) * fraction,
				heightM: before.heightM + (after.heightM - before.heightM) * progress,
			});
		}
	}
	if (normalized.length) samples.push({ at: Date.parse(normalized.at(-1).at), heightM: normalized.at(-1).heightM });
	return { events: normalized, samples };
}

export function tideCurveSvg(events, now = Date.now()) {
	const { events: extremes, samples } = eventPoints(events);
	if (samples.length < 2) return "<p class=\"text-body-secondary\">No tidal curve is available.</p>";
	const width = 640;
	const height = 260;
	const padding = { left: 44, right: 16, top: 18, bottom: 40 };
	const minTime = samples[0].at;
	const maxTime = samples.at(-1).at;
	const minHeight = Math.min(...samples.map((point) => point.heightM));
	const maxHeight = Math.max(...samples.map((point) => point.heightM));
	const heightRange = Math.max(0.1, maxHeight - minHeight);
	const x = (at) => padding.left + ((at - minTime) / (maxTime - minTime)) * (width - padding.left - padding.right);
	const y = (value) => padding.top + ((maxHeight - value) / heightRange) * (height - padding.top - padding.bottom);
	const line = samples.map((point, index) => `${index ? "L" : "M"}${x(point.at).toFixed(1)},${y(point.heightM).toFixed(1)}`).join(" ");
	const nowMs = new Date(now).getTime();
	const nowX = nowMs >= minTime && nowMs <= maxTime ? x(nowMs) : null;
	const labels = extremes.map((event) => `<g><circle cx="${x(Date.parse(event.at)).toFixed(1)}" cy="${y(event.heightM).toFixed(1)}" r="4"/><text x="${x(Date.parse(event.at)).toFixed(1)}" y="${height - 18}" text-anchor="middle">${new Date(event.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</text><text x="${x(Date.parse(event.at)).toFixed(1)}" y="${(y(event.heightM) - 8).toFixed(1)}" text-anchor="middle">${Number(event.heightM).toFixed(1)} m</text></g>`).join("");
	return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Predicted tide curve">
		<line class="axis" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"/>
		<path class="curve" d="${line}"/>
		${nowX == null ? "" : `<line class="now" x1="${nowX.toFixed(1)}" y1="${padding.top}" x2="${nowX.toFixed(1)}" y2="${height - padding.bottom}"/><text x="${nowX.toFixed(1)}" y="12" text-anchor="middle">Now</text>`}
		${labels}
	</svg>`;
}

export function createLocationTideController({
	L,
	map,
	controls,
	modal,
	fetchFn = globalThis.fetch,
	storage = globalThis.localStorage,
	windowObject = globalThis.window,
}) {
	const anchorageLayer = L.layerGroup();
	const locationLayer = L.layerGroup();
	let locations = [];
	let tide = null;
	let refreshTimer = null;

	async function requestJson(url, options = {}) {
		const response = await fetchFn(url, { cache: "no-store", credentials: "include", ...options });
		await assertAjrmMarineResponseAllowed(response, "Tide and location controls");
		const body = await response.json().catch(() => ({}));
		if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
		return body;
	}

	function setLayerVisible(layer, visible) {
		if (visible && !map.hasLayer(layer)) layer.addTo(map);
		if (!visible && map.hasLayer(layer)) layer.removeFrom(map);
	}

	function renderLayers() {
		anchorageLayer.clearLayers();
		locationLayer.clearLayers();
		for (const location of locations) {
			const position = locationPosition(location);
			if (!position) continue;
			const anchorage = location.types.some((type) => ANCHORAGE_TYPES.has(type));
			const icon = L.divIcon({
				className: `ajrm-location-marker ${anchorage ? "ajrm-location-marker-anchorage" : ""}`,
				html: `<span aria-hidden="true">${locationSymbol(location)}</span>`,
				iconSize: [28, 28], iconAnchor: [14, 14],
			});
			L.marker(position, { icon, title: location.name, riseOnHover: true })
				.bindPopup(popupHtml(location))
				.addTo(anchorage ? anchorageLayer : locationLayer);
		}
		setLayerVisible(anchorageLayer, controls.showAnchorages.checked);
		setLayerVisible(locationLayer, controls.showLocations.checked);
	}

	function renderPortChoices() {
		const previous = controls.alternativePort.value;
		controls.alternativePort.replaceChildren();
		for (const location of locations.filter((entry) =>
			entry.types.some((type) => PORT_TYPES.has(type)) && entry.properties?.tide?.providerId && entry.properties?.tide?.stationId,
		).sort((left, right) => left.name.localeCompare(right.name))) {
			controls.alternativePort.append(new Option(location.name, location.id));
		}
		controls.alternativePort.value = tide?.selectedPort?.id || previous;
		controls.pin.disabled = !controls.alternativePort.value;
		controls.clearPin.disabled = tide?.selection?.pinned !== true;
	}

	function renderTide() {
		const valid = tide?.valid === true;
		const stationName = tide?.station?.name || tide?.selectedPort?.name || "No station";
		controls.statusPanel.innerHTML = valid
			? `<span class="fw-semibold"><i class="bi bi-water"></i> ${escapeHtml(heightLabel(tide.heightNowM))} · ${escapeHtml(tide.trend)} · ${escapeHtml(stationName)}</span>`
			: `<span class="fw-semibold"><i class="bi bi-water"></i> Tide unavailable${stationName === "No station" ? "" : ` · ${escapeHtml(stationName)}`}</span>`;
		controls.statusPanel.classList.toggle("d-none", !controls.showStatus.checked);
		controls.statusPanel.classList.toggle("ajrm-marine-tide-status-stale", tide?.freshness?.state === "stale");
		controls.statusPanel.classList.toggle("ajrm-marine-tide-status-invalid", !valid);
		controls.unavailable.classList.toggle("d-none", valid);
		controls.unavailable.textContent = valid ? "" : tide?.error || "Tide Resolver has no valid result.";
		controls.heightNow.textContent = heightLabel(tide?.heightNowM);
		controls.trend.textContent = tide?.trend || "—";
		controls.nextHigh.textContent = tide?.nextHighWater ? `${timeLabel(tide.nextHighWater.at)} · ${heightLabel(tide.nextHighWater.heightM)}` : "—";
		controls.nextLow.textContent = tide?.nextLowWater ? `${timeLabel(tide.nextLowWater.at)} · ${heightLabel(tide.nextLowWater.heightM)}` : "—";
		controls.datum.textContent = tide?.datum || "—";
		controls.station.textContent = tide?.station ? `${tide.station.name} (${tide.station.id})` : "—";
		const reason = TIDE_SELECTION_LABELS[tide?.selection?.reason] || tide?.selection?.reason || "—";
		const automatic = tide?.selection?.pinned && tide.selection.automaticPort
			? `; automatic choice was ${tide.selection.automaticPort.name}` : "";
		controls.selectionReason.textContent = `${reason}${automatic}`;
		const ageHours = Number.isFinite(Number(tide?.freshness?.ageSeconds)) ? `${(Number(tide.freshness.ageSeconds) / 3600).toFixed(1)} h old` : "age unknown";
		controls.sourceFreshness.textContent = tide?.source
			? `${tide.source.provider} · ${tide.freshness?.state || "unknown"} · ${ageHours}` : "—";
		controls.curve.innerHTML = tideCurveSvg(tide?.curve, tide?.calculationReferenceAt || Date.now());
		renderPortChoices();
	}

	async function refresh({ force = false } = {}) {
		try {
			const [catalogue, result] = await Promise.all([
				requestJson(`${LOCATION_API}/locations?workspace=all`),
				force
					? requestJson(`${LOCATION_API}/tides/refresh`, { method: "POST", headers: ajrmMarineAuthHeaders({ "Content-Type": "application/json" }), body: "{}" })
					: requestJson(`${LOCATION_API}/tides/status`),
			]);
			locations = catalogue.locations || [];
			tide = result;
			renderLayers();
			renderTide();
			controls.actionStatus.textContent = force ? "Tidal data refreshed." : "";
		} catch (error) {
			tide = { valid: false, error: error.message };
			renderTide();
			controls.actionStatus.textContent = error.message;
		}
	}

	async function pin(portId) {
		try {
			controls.pin.disabled = true;
			tide = await requestJson(`${LOCATION_API}/tides/pin`, {
				method: "POST",
				headers: ajrmMarineAuthHeaders({ "Content-Type": "application/json" }),
				body: JSON.stringify({ portId: portId || null }),
			});
			renderTide();
			controls.actionStatus.textContent = portId ? "Alternative tidal port pinned." : "Automatic tidal-port selection restored.";
		} catch (error) {
			controls.actionStatus.textContent = error.message;
		} finally {
			controls.pin.disabled = !controls.alternativePort.value;
		}
	}

	function bindFlag(control, key, fallback, apply) {
		control.checked = readFlag(storage, key, fallback);
		control.addEventListener("change", () => { writeFlag(storage, key, control.checked); apply(); });
	}

	function init() {
		bindFlag(controls.showAnchorages, STORAGE.anchorages, true, renderLayers);
		bindFlag(controls.showLocations, STORAGE.locations, false, renderLayers);
		bindFlag(controls.showStatus, STORAGE.status, true, renderTide);
		controls.statusPanel.addEventListener("click", () => modal?.show?.());
		controls.pin.addEventListener("click", () => pin(controls.alternativePort.value));
		controls.clearPin.addEventListener("click", () => pin(null));
		controls.refresh.addEventListener("click", () => refresh({ force: true }));
		refresh();
		// The resolver owns provider caching, so a short UI poll keeps the
		// continuously changing height and freshness display useful without
		// causing a fresh upstream tide request each time.
		refreshTimer = windowObject.setInterval(() => refresh(), 60 * 1000);
	}

	function stop() {
		windowObject.clearInterval(refreshTimer);
		anchorageLayer.removeFrom(map);
		locationLayer.removeFrom(map);
	}

	return { init, refresh, stop, renderLayers, renderTide };
}
