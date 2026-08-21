/**
 * Displays shared AJRM locations and Tide Resolver output without duplicating
 * station selection, provider access or tidal calculations in the browser.
 */

import {
	ajrmMarineAuthHeaders,
	assertAjrmMarineResponseAllowed,
} from "./ajrm-marine-api-access.mjs";
import {
	attachTideCurveHover,
	interpolatedTideHeight,
	tideCurveEventsForDays,
	tideCurveSvg,
	tideGraphDays,
} from "@ajrm-marine/map-core/tide-curve";

export {
	attachTideCurveHover,
	interpolatedTideHeight,
	tideCurveEventsForDays,
	tideCurveSvg,
	tideGraphDays,
};

const LOCATION_API = "/plugins/signalk-ajrm-marine-location-editor";
const TIDE_API = "/plugins/signalk-ajrm-marine-tidal-database";
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
	explicitRequestedPort: "Tidal port selected in Display",
	explicitTideLocationRef: "Explicit tidal port assigned to this location",
	containingRegionAssignment: "Tidal port assigned to the containing tidal region",
	nearestPortInTidalRegion: "Nearest suitable port in the same tidal region",
	manualPinnedOverride: "Saved manual tidal-port override",
	none: "No suitable tidal port selected",
});

export function tidePortTitles(tide) {
	const portName = String(tide?.selectedPort?.name || "").trim() || "No tidal port";
	return { details: portName, graph: `${portName} — tidal curve` };
}

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

export function tideEventTimeLabel(value, locale = undefined, timeZone = undefined) {
	if (!value || Number.isNaN(Date.parse(value))) return "—";
	return new Intl.DateTimeFormat(locale, {
		weekday: "short", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
		...(timeZone ? { timeZone } : {}),
	}).format(new Date(value));
}

function heightLabel(value) {
	return value != null && Number.isFinite(Number(value)) ? `${Number(value).toFixed(2)} m` : "—";
}

export function tideMeasurementLabels(tide) {
	const valid = tide?.valid === true;
	const ageHours = Number.isFinite(Number(tide?.freshness?.ageSeconds))
		? `${(Number(tide.freshness.ageSeconds) / 3600).toFixed(1)} h old`
		: "age unknown";
	return {
		heightNow: valid ? heightLabel(tide?.heightNowM) : "—",
		trend: valid ? tide?.trend || "—" : "—",
		nextHigh: valid && tide?.nextHighWater ? `${tideEventTimeLabel(tide.nextHighWater.at)} · ${heightLabel(tide.nextHighWater.heightM)}` : "—",
		nextLow: valid && tide?.nextLowWater ? `${tideEventTimeLabel(tide.nextLowWater.at)} · ${heightLabel(tide.nextLowWater.heightM)}` : "—",
		distanceToFall: valid ? heightLabel(distanceToNextLowWater(tide)) : "—",
		datum: valid ? tide?.datum || "—" : "—",
		station: valid && tide?.station ? `${tide.station.name} (${tide.station.id})` : "—",
		sourceFreshness: valid && tide?.source
			? `${tide.source.provider} · ${tide.freshness?.state || "unknown"} · ${ageHours}`
			: "—",
	};
}


export function distanceToNextLowWater(tide) {
	if (tide?.heightNowM == null || tide?.nextLowWater?.heightM == null) return null;
	const current = Number(tide?.heightNowM);
	const low = Number(tide?.nextLowWater?.heightM);
	return Number.isFinite(current) && Number.isFinite(low) ? current - low : null;
}


export function tideMapContext(map, ownPosition = null) {
	const ownLatitude = Number(ownPosition?.latitude);
	const ownLongitude = Number(ownPosition?.longitude);
	if (ownPosition?.isValid !== false && Number.isFinite(ownLatitude) && ownLatitude >= -90 && ownLatitude <= 90 &&
		Number.isFinite(ownLongitude) && ownLongitude >= -180 && ownLongitude <= 180) {
		return { latitude: ownLatitude, longitude: ownLongitude };
	}
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
	if (context.portId) query.set("portId", String(context.portId));
	const suffix = query.toString();
	return `${TIDE_API}/tides/status${suffix ? `?${suffix}` : ""}`;
}

export function tideRequestContext(map, portId = null, ownPosition = null) {
	return {
		...tideMapContext(map, ownPosition),
		...(portId ? { portId: String(portId) } : {}),
	};
}

export function isSelectableTidePort(location) {
	return Boolean(location?.types?.some((type) => PORT_TYPES.has(type)));
}

export function createLocationTideController({
	L,
	map,
	controls,
	modal,
	fetchFn = globalThis.fetch,
	storage = globalThis.localStorage,
	windowObject = globalThis.window,
	getOwnPosition = () => null,
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
	let curveHoverController = null;
	let graphDays = tideGraphDays(storage?.getItem?.(STORAGE.graphDays));
	let selectedPortId = null;
	let requestSequence = 0;

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
		controls.alternativePort.replaceChildren();
		const automaticName = !selectedPortId && tide?.selectedPort?.name ? ` — ${tide.selectedPort.name}` : "";
		controls.alternativePort.append(new Option(`Automatic by position${automaticName}`, ""));
		for (const location of locations.filter(isSelectableTidePort).sort((left, right) => left.name.localeCompare(right.name))) {
			const kind = location.types.includes("tidalSecondaryPort") ? "secondary" : "standard";
			controls.alternativePort.append(new Option(`${location.name} (${kind})`, location.id));
		}
		controls.alternativePort.value = selectedPortId || "";
		controls.clearPin.disabled = !selectedPortId && tide?.selection?.pinned !== true;
	}

	function renderTide() {
		const valid = tide?.valid === true;
		const titles = tidePortTitles(tide);
		controls.detailsPortName.textContent = titles.details;
		controls.graphPortName.textContent = titles.graph;
		const measurements = tideMeasurementLabels(tide);
		const stationName = tide?.station?.name || tide?.selectedPort?.name || "No station";
		controls.statusPanel.innerHTML = valid
			? `<span class="fw-semibold"><i class="bi bi-water"></i> ${escapeHtml(heightLabel(tide.heightNowM))} · ${escapeHtml(tide.trend)} · ${escapeHtml(stationName)}</span>`
			: `<span class="fw-semibold"><i class="bi bi-water"></i> Tide unavailable${stationName === "No station" ? "" : ` · ${escapeHtml(stationName)}`}</span>`;
		controls.statusPanel.classList.toggle("d-none", !controls.showStatus.checked);
		controls.statusPanel.classList.toggle("ajrm-marine-tide-status-stale", tide?.freshness?.state === "stale");
		controls.statusPanel.classList.toggle("ajrm-marine-tide-status-invalid", !valid);
		controls.unavailable.classList.toggle("d-none", valid);
		controls.unavailable.textContent = valid ? "" : tide?.error || "Tide Resolver has no valid result.";
		// Never leave measurements from one station visible while another station
		// is selected, loading or unavailable. Port identity remains visible in the
		// status banner, but all station-derived values require a valid projection.
		controls.heightNow.textContent = measurements.heightNow;
		controls.trend.textContent = measurements.trend;
		controls.nextHigh.textContent = measurements.nextHigh;
		controls.nextLow.textContent = measurements.nextLow;
		controls.distanceToFall.textContent = measurements.distanceToFall;
		controls.datum.textContent = measurements.datum;
		controls.station.textContent = measurements.station;
		const reason = TIDE_SELECTION_LABELS[tide?.selection?.reason] || tide?.selection?.reason || "—";
		const automatic = tide?.selection?.pinned && tide.selection.automaticPort
			? `; automatic choice was ${tide.selection.automaticPort.name}` : "";
		controls.selectionReason.textContent = `${reason}${automatic}`;
		controls.sourceFreshness.textContent = measurements.sourceFreshness;
		const referenceAt = tide?.calculationReferenceAt || Date.now();
		const springNeap = springNeapEstimate(referenceAt);
		controls.springNeapStatus.textContent = springNeap?.status || "—";
		controls.springNeapTiming.textContent = springNeap?.timing || "—";
		const curveEvents = tideCurveEventsForDays(valid ? tide?.curve : [], referenceAt, graphDays);
		curveHoverController?.destroy();
		controls.curve.innerHTML = tideCurveSvg(
			curveEvents,
			referenceAt,
			valid ? tide?.referenceLevels : null,
		);
		curveHoverController = attachTideCurveHover(controls.curve, curveEvents, { windowObject });
		renderPortChoices();
	}

	function pendingTide(portId, error = "Tidal data have not been loaded for the selected port.") {
		const port = locations.find((location) => location.id === portId);
		return {
			valid: false,
			selectedPort: port ? { id: port.id, name: port.name } : null,
			selection: { reason: portId ? "explicitRequestedPort" : "none", pinned: false },
			heightNowM: null,
			nextHighWater: null,
			nextLowWater: null,
			trend: null,
			station: null,
			source: null,
			freshness: null,
			curve: [],
			error,
		};
	}

	function showPendingPort(portId, message) {
		tide = pendingTide(portId, message);
		renderTide();
	}

	async function refresh({ force = false } = {}) {
		const sequence = ++requestSequence;
		const requestedPortId = selectedPortId;
		try {
			const context = tideRequestContext(map, requestedPortId, getOwnPosition());
			const [catalogue, result] = await Promise.all([
				requestJson(`${LOCATION_API}/locations?workspace=all`),
				force
					? requestJson(`${TIDE_API}/tides/refresh`, { method: "POST", headers: ajrmMarineAuthHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(context) })
					: requestJson(tideStatusUrl(context)),
			]);
			if (sequence !== requestSequence) return;
			locations = catalogue.locations || [];
			tide = result;
			renderLayers();
			renderTide();
			controls.actionStatus.textContent = force
				? result?.valid ? "Tidal data refreshed." : result?.error || "Tidal data are unavailable for the selected port."
				: "";
		} catch (error) {
			if (sequence !== requestSequence) return;
			tide = pendingTide(requestedPortId, error.message);
			renderTide();
			controls.actionStatus.textContent = error.message;
		}
	}

	async function useAutomaticSelection() {
		const sequence = ++requestSequence;
		selectedPortId = null;
		showPendingPort(null, "Restoring automatic tidal-port selection…");
		try {
			const result = await requestJson(`${TIDE_API}/tides/pin`, {
				method: "POST",
				headers: ajrmMarineAuthHeaders({ "Content-Type": "application/json" }),
				body: JSON.stringify({ portId: null, ...tideMapContext(map, getOwnPosition()) }),
			});
			if (sequence !== requestSequence) return;
			tide = result;
			renderTide();
			controls.actionStatus.textContent = "Automatic tidal-port selection restored.";
		} catch (error) {
			if (sequence !== requestSequence) return;
			tide = pendingTide(selectedPortId, error.message);
			renderTide();
			controls.actionStatus.textContent = error.message;
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
		controls.alternativePort.addEventListener("change", () => {
			selectedPortId = controls.alternativePort.value || null;
			if (!selectedPortId) {
				useAutomaticSelection();
				return;
			}
			showPendingPort(selectedPortId, selectedPortId ? "Loading the selected tidal port…" : "Selecting a tidal port automatically…");
			controls.actionStatus.textContent = selectedPortId ? "Loading the selected tidal port…" : "Selecting a tidal port automatically…";
			refresh();
		});
		controls.clearPin.addEventListener("click", useAutomaticSelection);
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
