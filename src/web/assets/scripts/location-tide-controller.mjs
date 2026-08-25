/**
 * Displays shared AJRM locations plus Tide and Weather Database projections
 * without duplicating location selection, provider access or calculations in
 * the browser.
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
import { currentVesselPosition } from "./startup-position-gate.mjs";
import { renderForecastTable } from "./weather-forecast-view.mjs";

export {
	attachTideCurveHover,
	interpolatedTideHeight,
	tideCurveEventsForDays,
	tideCurveSvg,
	tideGraphDays,
};

const LOCATION_API = "/plugins/signalk-ajrm-marine-location-editor";
const TIDE_API = "/plugins/signalk-ajrm-marine-tidal-database";
const WEATHER_API = "/plugins/signalk-ajrm-marine-weather-database";
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
	"preferred-direct-provider": "Direct provider station preferred over matching entered corrections",
	none: "No suitable tidal port selected",
});

export function tidePortTitles(tide) {
	const portName = String(tide?.selectedPort?.name || "").trim() || "No tidal port";
	return { details: portName, graph: `${portName} — tidal curve` };
}

export function tideStatusLocationLabel(tide) {
	const selectedPort = tide?.selectedPort;
	const selectedName = String(selectedPort?.name || "").trim();
	const standardPort = tide?.station?.standardPort;
	const standardName = String(standardPort?.name || "").trim();
	const explicitlySecondary = selectedPort?.types?.includes?.("tidalSecondaryPort") === true;
	const explicitlyDifferentPort = Boolean(
		selectedPort?.id && standardPort?.id && selectedPort.id !== standardPort.id,
	);
	if (selectedName && standardName && (explicitlySecondary || explicitlyDifferentPort)) {
		return `${selectedName} · reference ${standardName}`;
	}
	return selectedName || standardName || String(tide?.station?.name || "").trim() || "No tidal port";
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
	const availability = tide?.availability || {};
	const hasEvents = availability.highWater || availability.lowWater;
	const ageHours = Number.isFinite(Number(tide?.freshness?.ageSeconds))
		? `${(Number(tide.freshness.ageSeconds) / 3600).toFixed(1)} h old`
		: "age unknown";
	return {
		heightNow: valid ? heightLabel(tide?.heightNowM) : "—",
		trend: valid ? tide?.trend || "—" : "—",
		nextHigh: availability.nextHighWater && tide?.nextHighWater ? `${tideEventTimeLabel(tide.nextHighWater.at)} · ${heightLabel(tide.nextHighWater.heightM)}` : "—",
		nextLow: availability.nextLowWater && tide?.nextLowWater ? `${tideEventTimeLabel(tide.nextLowWater.at)} · ${heightLabel(tide.nextLowWater.heightM)}` : "—",
		distanceToFall: valid ? heightLabel(distanceToNextLowWater(tide)) : "—",
		datum: valid || hasEvents ? tide?.datum || "—" : "—",
		station: (valid || hasEvents) && tide?.station ? `${tide.station.name} (${tide.station.id})` : "—",
		sourceFreshness: (valid || hasEvents) && tide?.source
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


export function tideMapContext(_map, ownPosition = null) {
	const position = currentVesselPosition(ownPosition);
	if (position) return { latitude: position.latitude, longitude: position.longitude };
	// Automatic environmental selection must never use the map centre. It may
	// be a startup fallback or somewhere the skipper is merely browsing.
	return {};
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

export function weatherNearestUrl(position = {}) {
	const context = tideMapContext(null, position);
	const query = new URLSearchParams();
	if (Number.isFinite(context.latitude)) query.set("latitude", String(context.latitude));
	if (Number.isFinite(context.longitude)) query.set("longitude", String(context.longitude));
	query.set("weatherDays", "16");
	query.set("marineDays", "8");
	return `${WEATHER_API}/weather/nearest?${query.toString()}`;
}

export function weatherDistanceLabel(value) {
	if (value === null || value === undefined || value === "") return "Distance unavailable";
	const metres = Number(value);
	if (!Number.isFinite(metres) || metres < 0) return "Distance unavailable";
	if (metres < 1000) return `${Math.round(metres)} m`;
	return `${(metres / 1852).toFixed(1)} NM (${(metres / 1000).toFixed(1)} km)`;
}

function weatherFetchedAtLabel(value) {
	if (!value || Number.isNaN(Date.parse(value))) return "time unknown";
	return new Intl.DateTimeFormat("en-GB", {
		timeZone: "Europe/London",
		day: "2-digit",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
		timeZoneName: "short",
	}).format(new Date(value));
}

function weatherAgeLabel(freshness = {}) {
	const seconds = Number(freshness.ageSeconds);
	if (!Number.isFinite(seconds)) return "age unknown";
	const hours = seconds / 3600;
	const band = freshness.ageBand === "danger"
		? "Danger: over 72 hours old"
		: freshness.ageBand === "warning"
			? "Warning: over 24 hours old"
			: "under 24 hours old";
	return `${hours.toFixed(1)} h old · ${band}`;
}

export function weatherPresentation(
	projection,
	{ isLastKnownPosition = false } = {},
) {
	const resolution = projection?.locationResolution || {};
	const selectedLocation = resolution.selectedLocation || projection?.contextLocation;
	const locationName = String(selectedLocation?.name || "").trim() || "No weather location";
	const distance = weatherDistanceLabel(resolution.distanceMetres);
	const differentCachedLocation = resolution.mode === "nearest-cached-location";
	const cachedFallback =
		resolution.cacheFallback === true || differentCachedLocation;
	const source = projection?.source || {};
	const sourceName = source.provider || source.providerId || "Unknown provider";
	const freshnessState = projection?.freshness?.state || source.freshness?.state || "unknown freshness";
	const freshness = projection?.freshness || source.freshness || {};
	const ageBand = ["warning", "danger"].includes(freshness.ageBand) ? freshness.ageBand : "normal";
	const cacheState = source.cache || "unknown cache state";
	const sourceFreshness = projection?.valid
		? `${sourceName} · fetched ${weatherFetchedAtLabel(source.fetchedAt)} · ${weatherAgeLabel(freshness)} · ${freshnessState} · ${cacheState}`
		: "—";
	const selection = differentCachedLocation
		? "Nearest cached weather location"
		: resolution.mode === "nearest-location"
			? cachedFallback
				? "Nearest weather location (cached forecast)"
				: "Nearest weather location"
			: "Weather location unavailable";
	const positionBasis = isLastKnownPosition
		? "the last known vessel position"
		: "the vessel";
	const fallbackLead = differentCachedLocation
		? "Showing the nearest usable cached forecast from"
		: "Showing the cached forecast for";
	const fallbackMessage = cachedFallback
		? `Live weather was unavailable. ${fallbackLead} ${locationName}, ${distance} from ${positionBasis}.${resolution.fallbackReason ? ` ${resolution.fallbackReason}` : ""}`
		: "";
	return {
		ageBand,
		cachedFallback,
		distance,
		fallbackMessage,
		locationName,
		selection,
		sourceFreshness,
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
	let weather = null;
	let weatherError = "";
	let currentPosition = null;
	let initialized = false;
	let refreshTimer = null;
	let anchoringTimer = null;
	let anchoring = null;
	let anchoringBusy = false;
	let anchoringRequestGeneration = 0;
	let curveHoverController = null;
	let graphDays = tideGraphDays(storage?.getItem?.(STORAGE.graphDays));
	let selectedPortId = null;
	let requestSequence = 0;

	async function requestJson(url, options = {}, accessLabel = "Tide, weather and location controls") {
		const response = await fetchFn(url, { cache: "no-store", credentials: "include", ...options });
		await assertAjrmMarineResponseAllowed(response, accessLabel);
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
		const automaticPosition = currentPosition?.isLastKnown
			? "last known position"
			: "position";
		controls.alternativePort.append(
			new Option(`Automatic by ${automaticPosition}${automaticName}`, ""),
		);
		for (const location of locations.filter(isSelectableTidePort).sort((left, right) => left.name.localeCompare(right.name))) {
			const kind = location.types.includes("tidalSecondaryPort") ? "secondary" : "standard";
			controls.alternativePort.append(new Option(`${location.name} (${kind})`, location.id));
		}
		controls.alternativePort.value = selectedPortId || "";
		controls.clearPin.disabled = !selectedPortId && tide?.selection?.pinned !== true;
	}

	function renderTide() {
		if (!tide) {
			controls.detailsPortName.textContent = "No tidal port";
			controls.graphPortName.textContent = "No tidal port — tidal curve";
			controls.statusPanel.innerHTML = "";
			controls.statusPanel.classList.add("d-none");
			controls.statusPanel.classList.remove(
				"ajrm-marine-tide-status-refresh-due",
				"ajrm-marine-tide-status-invalid",
			);
			controls.unavailable.classList.remove("d-none");
			controls.unavailable.textContent = currentPosition
				? "Tidal data have not been loaded yet."
				: "Waiting for the current vessel position before selecting tidal data.";
			for (const control of [
				controls.heightNow,
				controls.trend,
				controls.nextHigh,
				controls.nextLow,
				controls.distanceToFall,
				controls.datum,
				controls.station,
				controls.selectionReason,
				controls.sourceFreshness,
				controls.springNeapStatus,
				controls.springNeapTiming,
			]) {
				control.textContent = "—";
			}
			curveHoverController?.destroy();
			controls.curve.innerHTML = tideCurveSvg([]);
			renderPortChoices();
			return;
		}
		const valid = tide?.valid === true;
		const hasEvents = tide?.availability?.highWater || tide?.availability?.lowWater;
		const titles = tidePortTitles(tide);
		controls.detailsPortName.textContent = titles.details;
		controls.graphPortName.textContent = titles.graph;
		const measurements = tideMeasurementLabels(tide);
		const statusLocation = tideStatusLocationLabel(tide);
		controls.statusPanel.innerHTML = valid
			? `<span class="fw-semibold"><i class="bi bi-water"></i> ${escapeHtml(heightLabel(tide.heightNowM))} · ${escapeHtml(tide.trend)} · ${escapeHtml(statusLocation)}</span>`
			: `<span class="fw-semibold"><i class="bi bi-water"></i> ${hasEvents ? "Partial tide data" : "Tide unavailable"}${statusLocation === "No tidal port" ? "" : ` · ${escapeHtml(statusLocation)}`}</span>`;
		controls.statusPanel.classList.toggle("d-none", !controls.showStatus.checked);
		controls.statusPanel.classList.toggle("ajrm-marine-tide-status-refresh-due", tide?.freshness?.refreshDue === true);
		controls.statusPanel.classList.toggle("ajrm-marine-tide-status-invalid", !valid);
		controls.unavailable.classList.toggle("d-none", valid && !tide?.advisory);
		controls.unavailable.textContent = [valid ? null : tide?.error || "Tide Resolver has no valid result.", tide?.advisory?.message].filter(Boolean).join(" ");
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
		const lastKnown = !selectedPortId && currentPosition?.isLastKnown
			? "; using last known vessel position"
			: "";
		controls.selectionReason.textContent = `${reason}${automatic}${lastKnown}`;
		controls.sourceFreshness.textContent = measurements.sourceFreshness;
		const referenceAt = tide?.calculationReferenceAt || Date.now();
		const springNeap = springNeapEstimate(referenceAt);
		controls.springNeapStatus.textContent = springNeap?.status || "—";
		controls.springNeapTiming.textContent = springNeap?.timing || "—";
		const curveEvents = tideCurveEventsForDays(tide?.curve || [], referenceAt, graphDays);
		curveHoverController?.destroy();
		controls.curve.innerHTML = tideCurveSvg(
			curveEvents,
			referenceAt,
			valid ? tide?.referenceLevels : null,
		);
		curveHoverController = attachTideCurveHover(controls.curve, curveEvents, { windowObject });
		renderPortChoices();
	}

	function renderWeather() {
		const valid = weather?.valid === true;
		const isLastKnownPosition = currentPosition?.isLastKnown === true;
		const presentation = weatherPresentation(weather, { isLastKnownPosition });
		controls.weatherLocationName.textContent = presentation.locationName;
		controls.weatherDistanceLabel.textContent = isLastKnownPosition
			? "Distance from last known position"
			: "Distance from vessel";
		controls.weatherDistance.textContent = valid ? presentation.distance : "—";
		controls.weatherSelection.textContent = valid ? presentation.selection : "—";
		controls.weatherSourceFreshness.textContent = presentation.sourceFreshness;
		controls.weatherSourceFreshness.classList.toggle("text-warning", presentation.ageBand === "warning");
		controls.weatherSourceFreshness.classList.toggle("text-danger", presentation.ageBand === "danger");
		controls.weatherFallback.classList.toggle(
			"d-none",
			!valid || !presentation.cachedFallback,
		);
		controls.weatherFallback.textContent = presentation.fallbackMessage;
		const waitingForPosition = !currentPosition;
		controls.weatherUnavailable.classList.toggle("d-none", valid);
		controls.weatherUnavailable.textContent = valid
			? ""
			: waitingForPosition
				? "Waiting for the current vessel position before selecting weather data."
				: weatherError || weather?.error || "Weather Database has no usable forecast.";
		const rowCount = renderForecastTable(
			controls.weatherTable,
			valid ? weather : null,
		);
		controls.weatherStatus.textContent = valid
			? `${rowCount} hourly weather rows from ${presentation.locationName}.`
			: "";
		controls.refreshWeather.disabled = !currentPosition;
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

	function normalizedPosition(value) {
		return currentVesselPosition(value);
	}

	function syncCurrentPositionFromGetter() {
		const candidate = getOwnPosition?.();
		if (candidate != null) currentPosition = normalizedPosition(candidate);
		return currentPosition;
	}

	async function settledRequest(request) {
		try {
			return { ok: true, value: await request };
		} catch (error) {
			return { ok: false, error };
		}
	}

	async function refreshLocations() {
		try {
			const catalogue = await requestJson(`${LOCATION_API}/locations?workspace=all`);
			locations = catalogue.locations || [];
			renderLayers();
			renderPortChoices();
			return true;
		} catch {
			return false;
		}
	}

	async function refresh({ force = false } = {}) {
		const sequence = ++requestSequence;
		const requestedPortId = selectedPortId;
		const position = syncCurrentPositionFromGetter();
		if (!position && !requestedPortId) {
			tide = null;
			weather = null;
			weatherError = "";
			renderTide();
			renderWeather();
			return false;
		}
		const context = tideRequestContext(map, requestedPortId, position);
		const catalogueRequest = settledRequest(
			requestJson(`${LOCATION_API}/locations?workspace=all`),
		);
		const tideRequest = settledRequest(
			force
				? requestJson(`${TIDE_API}/tides/refresh`, {
						method: "POST",
						headers: ajrmMarineAuthHeaders({ "Content-Type": "application/json" }),
						body: JSON.stringify(context),
					})
				: requestJson(tideStatusUrl(context)),
		);
		const weatherRequest = position
			? settledRequest(
					requestJson(
						weatherNearestUrl(position),
						{},
						"Weather Database controls",
					),
				)
			: Promise.resolve({ ok: false, skipped: true });
		const [catalogueResult, tideResult] = await Promise.all([
			catalogueRequest,
			tideRequest,
		]);
		if (sequence !== requestSequence) return false;

		const actionMessages = [];
		if (catalogueResult.ok) {
			locations = catalogueResult.value.locations || [];
			renderLayers();
		} else {
			actionMessages.push(catalogueResult.error.message);
		}
		if (tideResult.ok) {
			tide = tideResult.value;
			if (force) {
				actionMessages.push(
					tide.valid
						? "Tidal data refreshed."
						: tide.error || "Tidal data are unavailable for the selected port.",
				);
			}
		} else {
			tide = pendingTide(requestedPortId, tideResult.error.message);
			actionMessages.push(tideResult.error.message);
		}
		renderTide();
		controls.actionStatus.textContent = actionMessages.join(" ");

		// Weather may need an upstream timeout before Weather Database selects a
		// cached fallback. Do not hold back otherwise valid local tide data while
		// that independent request settles.
		const weatherResult = await weatherRequest;
		if (sequence !== requestSequence) return false;
		if (weatherResult.ok) {
			weather = weatherResult.value;
			weatherError = "";
		} else if (!weatherResult.skipped) {
			weather = null;
			weatherError = weatherResult.error.message;
		} else {
			weather = null;
			weatherError = "";
		}
		renderWeather();
		return true;
	}

	async function useAutomaticSelection() {
		const sequence = ++requestSequence;
		selectedPortId = null;
		const position = syncCurrentPositionFromGetter();
		if (!position) {
			tide = null;
			renderTide();
			controls.actionStatus.textContent =
				"Waiting for the current vessel position before selecting a tidal port automatically.";
			return;
		}
		showPendingPort(null, "Restoring automatic tidal-port selection…");
		try {
			const result = await requestJson(`${TIDE_API}/tides/pin`, {
				method: "POST",
				headers: ajrmMarineAuthHeaders({ "Content-Type": "application/json" }),
				body: JSON.stringify({
					portId: null,
					...tideMapContext(null, position),
				}),
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
		const generation = ++anchoringRequestGeneration;
		const position = syncCurrentPositionFromGetter();
		if (!position || position.isLastKnown) {
			anchoring = null;
			renderAnchoring();
			return false;
		}
		let result = null;
		try {
			result = await requestJson(`${LOCATION_API}/anchoring/status`);
		} catch {
			result = null;
		}
		if (
			generation !== anchoringRequestGeneration ||
			!currentPosition ||
			currentPosition.isLastKnown
		) {
			return false;
		}
		anchoring = result;
		renderAnchoring();
		return true;
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

	function notifyPositionChanged(position = getOwnPosition?.()) {
		const previousPosition = currentPosition;
		currentPosition = normalizedPosition(position);
		if (!currentPosition) {
			anchoringRequestGeneration += 1;
			if (previousPosition) requestSequence += 1;
			weather = null;
			weatherError = "";
			renderWeather();
			if (!selectedPortId) {
				tide = null;
				renderTide();
			}
			anchoring = null;
			renderAnchoring();
			return false;
		}
		const positionSourceChanged =
			previousPosition?.isLastKnown !== currentPosition.isLastKnown;
		const freshReplacedLastKnown =
			previousPosition?.isLastKnown === true && !currentPosition.isLastKnown;
		const lastKnownReplacedFresh =
			previousPosition?.isLastKnown === false && currentPosition.isLastKnown;
		if (freshReplacedLastKnown) {
			weather = null;
			weatherError = "";
			if (!selectedPortId) tide = null;
		}
		if (lastKnownReplacedFresh) {
			anchoringRequestGeneration += 1;
			// A suggestion inferred while GPS was fresh must disappear as soon as
			// the position becomes retained evidence. Do not leave it actionable
			// until the next 15-second anchoring poll.
			anchoring = null;
			renderAnchoring();
		}
		if (positionSourceChanged) {
			renderTide();
			renderWeather();
		}
		// The target subscription may publish every second. It updates the position
		// used by the 60-second poll. Request immediately for the first usable
		// position and when a retained last-known position is replaced by fresh GPS.
		if (!initialized || (previousPosition && !freshReplacedLastKnown)) return false;
		return Promise.all([refresh(), refreshAnchoring()]);
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
		controls.refreshWeather.addEventListener("click", () => refresh());
		controls.confirmAnchoring.addEventListener("click", () => anchoringAction("confirm"));
		controls.dismissAnchoring.addEventListener("click", () => anchoringAction("dismiss"));
		initialized = true;
		currentPosition = normalizedPosition(getOwnPosition?.());
		renderTide();
		renderWeather();
		renderAnchoring();
		// Locations are safe to catalogue without making any tide or weather
		// inference, and keep manual tidal-port selection useful without GPS.
		refreshLocations();
		if (currentPosition) {
			refresh();
			refreshAnchoring();
		}
		// The resolver owns provider caching, so a short UI poll keeps the
		// continuously changing height and freshness display useful without
		// causing a fresh upstream tide request each time.
		refreshTimer = windowObject.setInterval(() => refresh(), 60 * 1000);
		anchoringTimer = windowObject.setInterval(() => refreshAnchoring(), 15 * 1000);
	}

	function stop() {
		anchoringRequestGeneration += 1;
		windowObject.clearInterval(refreshTimer);
		windowObject.clearInterval(anchoringTimer);
		anchorageLayer.removeFrom(map);
		locationLayer.removeFrom(map);
	}

	return {
		init,
		notifyPositionChanged,
		refresh,
		refreshAnchoring,
		stop,
		renderLayers,
		renderTide,
		renderWeather,
		renderAnchoring,
	};
}
