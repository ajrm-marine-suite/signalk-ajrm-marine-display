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
	graphDays: "ajrmMarineDisplay.tideGraphDays",
	locations: "ajrmMarineDisplay.showLocations",
	status: "ajrmMarineDisplay.showTideStatus",
};
const ANCHORAGE_TYPES = new Set(["anchorage", "mooring"]);
const PORT_TYPES = new Set(["tidalStandardPort", "tidalSecondaryPort"]);
const DAY_MS = 24 * 60 * 60 * 1000;
const SYNODIC_MONTH_DAYS = 29.530588853;
const SPRING_NEAP_INTERVAL_MS = (SYNODIC_MONTH_DAYS / 4) * DAY_MS;
// NASA's primary-phase table records this new moon at 18:15 UTC. A mean
// synodic interval is sufficient for the deliberately approximate orientation
// shown here; it is not used for tidal-height or navigation calculations.
const SPRING_EPOCH_MS = Date.UTC(2000, 0, 6, 18, 15);

export const TIDE_SELECTION_LABELS = Object.freeze({
	explicitTideLocationRef: "Explicit tidal port assigned to this location",
	containingRegionAssignment: "Tidal port assigned to the containing tidal region",
	nearestPortInTidalRegion: "Nearest suitable port in the same tidal region",
	manualPinnedOverride: "Manually pinned alternative port",
	none: "No suitable tidal port selected",
});

export function anchoringSuggestionText(value) {
	return value?.state === "suggested" && value?.suggestionId
		? `You appear stationary at ${value.location?.name || "an anchorage or mooring"}. Select the Anchored profile?`
		: "";
}

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

export function tideGraphDays(value, fallback = 7) {
	const days = Math.trunc(Number(value));
	return days >= 1 && days <= 7 ? days : fallback;
}

export function tideCurveEventsForDays(events, now = Date.now(), days = 7) {
	const nowMs = new Date(now).getTime();
	const endMs = nowMs + tideGraphDays(days) * DAY_MS;
	const normalized = (events || []).filter((event) =>
		Number.isFinite(Number(event?.heightM)) && !Number.isNaN(Date.parse(event?.at)),
	).sort((left, right) => Date.parse(left.at) - Date.parse(right.at));
	const previous = normalized.filter((event) => Date.parse(event.at) <= nowMs).at(-1);
	const visible = normalized.filter((event) => Date.parse(event.at) >= nowMs && Date.parse(event.at) <= endMs);
	return previous && visible[0] !== previous ? [previous, ...visible] : visible;
}

function phaseName(index) {
	return ((index % 2) + 2) % 2 === 0 ? "spring" : "neap";
}

function phaseDays(value) {
	return `${Math.max(0, value).toFixed(1)} days`;
}

export function springNeapEstimate(now = Date.now()) {
	const nowMs = new Date(now).getTime();
	if (!Number.isFinite(nowMs)) return null;
	const phaseIndex = Math.floor((nowMs - SPRING_EPOCH_MS) / SPRING_NEAP_INTERVAL_MS);
	const previousAt = SPRING_EPOCH_MS + phaseIndex * SPRING_NEAP_INTERVAL_MS;
	const nextAt = previousAt + SPRING_NEAP_INTERVAL_MS;
	const previous = phaseName(phaseIndex);
	const next = phaseName(phaseIndex + 1);
	const daysAfter = (nowMs - previousAt) / DAY_MS;
	const daysBefore = (nextAt - nowMs) / DAY_MS;
	const nearPrevious = daysAfter <= 0.5;
	const nearNext = daysBefore <= 0.5;
	const nearest = nearPrevious ? previous : nearNext ? next : null;
	return {
		contract: "astronomical-spring-neap-estimate-v1",
		status: nearest
			? `Near ${nearest} tides`
			: next === "spring" ? "Building toward spring tides" : "Easing toward neap tides",
		timing: `${phaseDays(daysAfter)} after ${previous}; ${phaseDays(daysBefore)} before ${next}`,
		previous,
		next,
		daysAfter,
		daysBefore,
	};
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
	const spanDays = Math.max(1, (samples.at(-1).at - samples[0].at) / (24 * 60 * 60 * 1000));
	// Four extremes per day is common. Reserve roughly 100 px for each label so
	// a day/date such as "Wed 19 Aug" cannot collide with its neighbour.
	const width = Math.max(800, Math.ceil(spanDays * 400));
	const height = 310;
	// Keep a distinct annotation band around the curve. This prevents high-water
	// labels being clipped and leaves low-water heights and two-line timestamps
	// clear of both the curve and one another.
	const padding = { left: 64, right: 64, top: 38, bottom: 70 };
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
	const dateFormatter = new Intl.DateTimeFormat(undefined, {
		weekday: "short", day: "numeric", month: "short",
	});
	const timeFormatter = new Intl.DateTimeFormat(undefined, {
		hour: "2-digit", minute: "2-digit",
	});
	const labels = extremes.map((event) => {
		const eventDate = new Date(event.at);
		const eventX = x(eventDate.getTime()).toFixed(1);
		const eventY = y(event.heightM);
		const isLowWater = String(event.type || "").toLowerCase() === "low";
		const heightLabelY = eventY + (isLowWater ? 20 : -10);
		return `<g class="extreme extreme-${isLowWater ? "low" : "high"}">
			<circle cx="${eventX}" cy="${eventY.toFixed(1)}" r="4"/>
			<text class="extreme-time" x="${eventX}" y="${height - 38}" text-anchor="middle">
				<tspan x="${eventX}">${dateFormatter.format(eventDate)}</tspan>
				<tspan x="${eventX}" dy="16">${timeFormatter.format(eventDate)}</tspan>
			</text>
			<text class="extreme-height" x="${eventX}" y="${heightLabelY.toFixed(1)}" text-anchor="middle">${Number(event.heightM).toFixed(1)} m</text>
		</g>`;
	}).join("");
	return `<svg viewBox="0 0 ${width} ${height}" style="width:${width}px;max-width:none" role="img" aria-label="Predicted tide curve">
		<line class="axis" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"/>
		<path class="curve" d="${line}"/>
		${nowX == null ? "" : `<line class="now" x1="${nowX.toFixed(1)}" y1="${padding.top}" x2="${nowX.toFixed(1)}" y2="${height - padding.bottom}"/><text x="${nowX.toFixed(1)}" y="12" text-anchor="middle">Now</text>`}
		${labels}
	</svg>`;
}

export function tideMapContext(map) {
	const center = map?.getCenter?.();
	const latitude = Number(center?.lat);
	const longitude = Number(center?.lng);
	return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
		Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
		? { latitude, longitude }
		: {};
}

export function tideStatusUrl(context = {}) {
	const query = new URLSearchParams();
	if (Number.isFinite(context.latitude)) query.set("latitude", String(context.latitude));
	if (Number.isFinite(context.longitude)) query.set("longitude", String(context.longitude));
	const suffix = query.toString();
	return `${LOCATION_API}/tides/status${suffix ? `?${suffix}` : ""}`;
}

export function createLocationTideController({
	L,
	map,
	controls,
	modal,
	fetchFn = globalThis.fetch,
	storage = globalThis.localStorage,
	windowObject = globalThis.window,
	onProfileChanged = async () => {},
}) {
	const anchorageLayer = L.layerGroup();
	const locationLayer = L.layerGroup();
	let locations = [];
	let tide = null;
	let refreshTimer = null;
	let anchoringTimer = null;
	let anchoring = null;
	let anchoringBusy = false;
	let graphDays = tideGraphDays(storage?.getItem?.(STORAGE.graphDays));

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
		const referenceAt = tide?.calculationReferenceAt || Date.now();
		const springNeap = springNeapEstimate(referenceAt);
		controls.springNeapStatus.textContent = springNeap?.status || "—";
		controls.springNeapTiming.textContent = springNeap?.timing || "—";
		controls.curve.innerHTML = tideCurveSvg(
			tideCurveEventsForDays(tide?.curve, referenceAt, graphDays),
			referenceAt,
		);
		renderPortChoices();
	}

	async function refresh({ force = false } = {}) {
		try {
			const context = tideMapContext(map);
			const [catalogue, result] = await Promise.all([
				requestJson(`${LOCATION_API}/locations?workspace=all`),
				force
					? requestJson(`${LOCATION_API}/tides/refresh`, { method: "POST", headers: ajrmMarineAuthHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(context) })
					: requestJson(tideStatusUrl(context)),
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
				body: JSON.stringify({ portId: portId || null, ...tideMapContext(map) }),
			});
			renderTide();
			controls.actionStatus.textContent = portId ? "Alternative tidal port pinned." : "Automatic tidal-port selection restored.";
		} catch (error) {
			controls.actionStatus.textContent = error.message;
		} finally {
			controls.pin.disabled = !controls.alternativePort.value;
		}
	}

	function renderAnchoring() {
		const message = anchoringSuggestionText(anchoring);
		const suggested = Boolean(message);
		controls.anchoringSuggestion.classList.toggle("d-none", !suggested);
		controls.anchoringSuggestionText.textContent = message;
		controls.confirmAnchoring.disabled = anchoringBusy;
		controls.dismissAnchoring.disabled = anchoringBusy;
	}

	async function refreshAnchoring() {
		try {
			anchoring = await requestJson(`${LOCATION_API}/anchoring/status`);
		} catch {
			anchoring = null;
		}
		renderAnchoring();
	}

	async function anchoringAction(action) {
		if (anchoringBusy || !anchoring?.suggestionId) return;
		anchoringBusy = true;
		renderAnchoring();
		try {
			anchoring = await requestJson(`${LOCATION_API}/anchoring/${action}`, {
				method: "POST",
				headers: ajrmMarineAuthHeaders({ "Content-Type": "application/json" }),
				body: JSON.stringify({ suggestionId: anchoring.suggestionId }),
			});
			if (action === "confirm") await onProfileChanged();
		} catch (error) {
			controls.actionStatus.textContent = error.message;
			await refreshAnchoring();
		} finally {
			anchoringBusy = false;
			renderAnchoring();
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
		controls.graphDays.value = String(graphDays);
		controls.graphDays.addEventListener("change", () => {
			graphDays = tideGraphDays(controls.graphDays.value);
			storage?.setItem?.(STORAGE.graphDays, String(graphDays));
			renderTide();
		});
		const openTides = () => {
			modal?.show?.();
			refresh();
		};
		controls.open.addEventListener("click", openTides);
		controls.statusPanel.addEventListener("click", openTides);
		controls.pin.addEventListener("click", () => pin(controls.alternativePort.value));
		controls.clearPin.addEventListener("click", () => pin(null));
		controls.refresh.addEventListener("click", () => refresh({ force: true }));
		controls.confirmAnchoring.addEventListener("click", () => anchoringAction("confirm"));
		controls.dismissAnchoring.addEventListener("click", () => anchoringAction("dismiss"));
		refresh();
		refreshAnchoring();
		// The resolver owns provider caching, so a short UI poll keeps the
		// continuously changing height and freshness display useful without
		// causing a fresh upstream tide request each time.
		refreshTimer = windowObject.setInterval(() => refresh(), 60 * 1000);
		anchoringTimer = windowObject.setInterval(() => refreshAnchoring(), 15 * 1000);
	}

	function stop() {
		windowObject.clearInterval(refreshTimer);
		windowObject.clearInterval(anchoringTimer);
		anchorageLayer.removeFrom(map);
		locationLayer.removeFrom(map);
	}

	return { init, refresh, refreshAnchoring, stop, renderLayers, renderTide, renderAnchoring };
}
