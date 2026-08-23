/**
 * Verifies Tide Resolver reason labels and the deterministic Display curve.
 */

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import {
	TIDE_SELECTION_LABELS,
	anchoringSuggestionText,
	createLocationTideController,
	distanceToNextLowWater,
	interpolatedTideHeight,
	isSelectableTidePort,
	springNeapEstimate,
	tideMapContext,
	tideCurveEventsForDays,
	tideGraphDays,
	tideMeasurementLabels,
	tidePortTitles,
	tideRequestContext,
	tideStatusUrl,
	tideCurveSvg,
	tideEventTimeLabel,
	weatherDistanceLabel,
	weatherNearestUrl,
	weatherPresentation,
} from "../src/web/assets/scripts/location-tide-controller.mjs";

test("both tide tabs identify the selected tidal port", () => {
	assert.deepEqual(tidePortTitles({ selectedPort: { name: "Port Ellen" } }), {
		details: "Port Ellen",
		graph: "Port Ellen — tidal curve",
	});
	assert.deepEqual(tidePortTitles(null), { details: "No tidal port", graph: "No tidal port — tidal curve" });
});

test("tidal selection reasons are translated into skipper-facing explanations", () => {
	assert.match(TIDE_SELECTION_LABELS.explicitRequestedPort, /selected in Display/);
	assert.match(TIDE_SELECTION_LABELS.explicitTideLocationRef, /Explicit tidal port/);
	assert.match(TIDE_SELECTION_LABELS.containingRegionAssignment, /containing tidal region/);
	assert.match(TIDE_SELECTION_LABELS.nearestPortInTidalRegion, /Nearest suitable port/);
	assert.match(TIDE_SELECTION_LABELS.manualPinnedOverride, /manual tidal-port override/);
	assert.match(TIDE_SELECTION_LABELS["preferred-direct-provider"], /Direct provider station preferred/);
});

test("spring-neap estimate reports elapsed and remaining phase days", () => {
	const spring = springNeapEstimate("2000-01-06T18:15:00Z");
	assert.equal(spring.status, "Near spring tides");
	assert.equal(spring.previous, "spring");
	assert.equal(spring.daysAfter, 0);
	assert.match(spring.timing, /0\.0 days after spring/);
	assert.match(spring.timing, /7\.4 days before neap/);

	const easing = springNeapEstimate("2000-01-09T18:15:00Z");
	assert.equal(easing.status, "Easing toward neap tides");
	assert.match(easing.timing, /3\.0 days after spring/);

	const building = springNeapEstimate("2000-01-16T18:15:00Z");
	assert.equal(building.status, "Building toward spring tides");
	assert.equal(building.previous, "neap");
});

test("explicit UTC tide instants display as UK civil time across daylight saving", () => {
	assert.match(tideEventTimeLabel("2026-08-18T08:53:00.000Z", "en-GB", "Europe/London"), /09:53 BST/);
	assert.match(tideEventTimeLabel("2026-12-18T08:53:00.000Z", "en-GB", "Europe/London"), /08:53 GMT/);
});

test("tide graph duration defaults to seven days and rejects invalid stored values", () => {
	assert.equal(tideGraphDays(null), 7);
	assert.equal(tideGraphDays("3"), 3);
	assert.equal(tideGraphDays("9"), 7);
});

test("tide graph duration keeps the preceding extreme and selected future days", () => {
	const events = [
		{ at: "2026-08-17T18:00:00Z", heightM: 1 },
		{ at: "2026-08-18T06:00:00Z", heightM: 5 },
		{ at: "2026-08-19T06:00:00Z", heightM: 4.8 },
		{ at: "2026-08-20T06:00:00Z", heightM: 4.6 },
	];
	assert.deepEqual(
		tideCurveEventsForDays(events, "2026-08-18T00:00:00Z", 1).map((event) => event.at),
		["2026-08-17T18:00:00Z", "2026-08-18T06:00:00Z"],
	);
});

test("the hidden tide launcher leaves modal ownership to the controller", async () => {
	const html = await fs.readFile(new URL("../src/web/index.html", import.meta.url), "utf8");
	const launcher = html.match(/<button[\s\S]*?id="buttonOpenTides"[\s\S]*?<\/button>/)?.[0] || "";
	assert.ok(launcher);
	assert.doesNotMatch(launcher, /data-bs-(?:toggle|target)/);
	assert.match(html, /id="selectTideGraphDays"/);
	assert.match(html, /id="tideDetailsTab"[\s\S]*?data-bs-target="#tideDetailsPane"/);
	assert.match(html, /id="tideGraphTab"[\s\S]*?data-bs-target="#tideGraphPane"/);
	assert.match(html, /id="weatherTab"[\s\S]*?data-bs-target="#weatherPane"/);
	assert.match(html, /id="tideDetailsPane"[\s\S]*?id="tideHeightNow"/);
	assert.match(html, /id="tideDetailsPortName"/);
	assert.match(html, /id="tideDistanceToFall"/);
	assert.match(html, /id="tideGraphPane"[\s\S]*?id="tideCurve"/);
	assert.match(html, /id="tideGraphPortName"/);
	assert.match(html, /id="weatherPane"[\s\S]*?id="weatherForecastTable"/);
	assert.match(
		html,
		/class="table-responsive ajrm-weather-forecast-table-wrap"[^>]*role="region"[^>]*aria-label="Hourly weather forecast"[^>]*tabindex="0"/,
	);
	assert.match(html, /<caption class="visually-hidden">Hourly weather and marine forecast/);
	assert.match(html, /id="weatherDistance"/);
	assert.match(html, /id="weatherDistanceLabel"/);
	assert.match(html, /Weather is selected independently from the tidal port/);
	assert.match(html, /modal-dialog[^"]*ajrm-tide-modal-dialog/);
	assert.match(html, /id="tideModalResizeHandle"[^>]*aria-label="Resize tides and weather window"/);
	assert.doesNotMatch(html, /buttonPinTidePort|Use selected port/);
	assert.match(html, /Choosing a tidal port applies it immediately/);
});

test("automatic tide requests never use the visible chart centre as selection context", () => {
	const context = tideMapContext({ getCenter: () => ({ lat: 56.27224, lng: -5.637656 }) });
	assert.deepEqual(context, {});
	const url = new URL(tideStatusUrl(context), "https://example.test");
	assert.equal(url.searchParams.get("latitude"), null);
	assert.equal(url.searchParams.get("longitude"), null);
	const alternative = tideRequestContext(
		{ getCenter: () => ({ lat: 56.27224, lng: -5.637656 }) },
		"alternative-port-id",
	);
	const alternativeUrl = new URL(tideStatusUrl(alternative), "https://example.test");
	assert.equal(alternative.portId, "alternative-port-id");
	assert.equal(alternativeUrl.searchParams.get("portId"), "alternative-port-id");
});

test("automatic tide selection prefers the live vessel position to the chart centre", () => {
	const context = tideMapContext(
		{ getCenter: () => ({ lat: 56, lng: -5 }) },
		{
			isValid: true,
			latitude: 55.5,
			longitude: -6.25,
			lastSeenDate: new Date(),
		},
	);
	assert.deepEqual(context, { latitude: 55.5, longitude: -6.25 });
});

test("tidal-port chooser includes secondary ports resolved through a parent", () => {
	assert.equal(isSelectableTidePort({
		types: ["tidalSecondaryPort"],
		properties: { tide: {
			parentLocationRef: "/resources/locations/parent",
			secondaryPortCorrections: { contract: "ajrm-secondary-port-corrections-v3" },
		} },
	}), true);
	assert.equal(isSelectableTidePort({ types: ["tidalSecondaryPort"], properties: { tide: {} } }), true);
});

test("invalid chart centres do not create misleading tide coordinates", () => {
	assert.deepEqual(tideMapContext({ getCenter: () => ({ lat: 100, lng: -5 }) }), {});
	assert.deepEqual(tideMapContext(null, { latitude: null, longitude: "" }), {});
	assert.equal(tideStatusUrl({}), "/plugins/signalk-ajrm-marine-tidal-database/tides/status");
});

test("automatic environmental context accepts retained stale or lost fixes", () => {
	assert.deepEqual(tideMapContext(null, {
		isValid: true,
		isStale: true,
		latitude: 56.2,
		longitude: -5.6,
	}), { latitude: 56.2, longitude: -5.6 });
	assert.deepEqual(tideMapContext(null, {
		isValid: true,
		isLost: true,
		latitude: 56.2,
		longitude: -5.6,
	}), { latitude: 56.2, longitude: -5.6 });
});

test("weather requests explicitly ask Weather Database for the nearest location", () => {
	const url = new URL(
		weatherNearestUrl({ latitude: 56.27224, longitude: -5.637656 }),
		"https://example.test",
	);
	assert.equal(
		url.pathname,
		"/plugins/signalk-ajrm-marine-weather-database/weather/nearest",
	);
	assert.equal(url.searchParams.get("latitude"), "56.27224");
	assert.equal(url.searchParams.get("longitude"), "-5.637656");
	assert.equal(url.searchParams.get("weatherDays"), "16");
	assert.equal(url.searchParams.get("marineDays"), "8");
});

test("nearest cached weather presentation makes vessel distance explicit", () => {
	const presentation = weatherPresentation({
		valid: true,
		locationResolution: {
			mode: "nearest-cached-location",
			cacheFallback: true,
			selectedLocation: { name: "Cached Bay" },
			distanceMetres: 4630,
			fallbackReason: "Pi is offline",
		},
		source: {
			provider: "Open-Meteo",
			fetchedAt: "2026-08-23T08:00:00Z",
			cache: "nearest-fallback",
		},
		freshness: { state: "stale" },
	});
	assert.equal(presentation.locationName, "Cached Bay");
	assert.equal(presentation.distance, "2.5 NM (4.6 km)");
	assert.equal(presentation.selection, "Nearest cached weather location");
	assert.match(presentation.fallbackMessage, /2\.5 NM \(4\.6 km\) from the vessel/);
	assert.match(presentation.fallbackMessage, /Pi is offline/);
	assert.match(presentation.sourceFreshness, /nearest-fallback/);
	const lastKnownPresentation = weatherPresentation(
		{
			valid: true,
			locationResolution: {
				mode: "nearest-cached-location",
				cacheFallback: true,
				selectedLocation: { name: "Cached Bay" },
				distanceMetres: 4630,
			},
		},
		{ isLastKnownPosition: true },
	);
	assert.match(
		lastKnownPresentation.fallbackMessage,
		/2\.5 NM \(4\.6 km\) from the last known vessel position/,
	);
	assert.equal(weatherDistanceLabel(250), "250 m");
	assert.equal(weatherDistanceLabel(null), "Distance unavailable");
});

test("weather presentation distinguishes exact cached data from a different cached location", () => {
	const exactCached = weatherPresentation({
		valid: true,
		locationResolution: {
			mode: "nearest-location",
			cacheFallback: true,
			selectedLocation: { name: "Oban" },
			distanceMetres: 250,
			fallbackReason: "provider offline",
		},
		source: {
			provider: "Open-Meteo",
			cache: "fallback",
			fallbackReason: "provider offline",
		},
	});
	assert.equal(
		exactCached.selection,
		"Nearest weather location (cached forecast)",
	);
	assert.match(exactCached.fallbackMessage, /cached forecast for Oban/);
	assert.doesNotMatch(exactCached.fallbackMessage, /nearest usable cached/);

	const mixedProviders = weatherPresentation({
		valid: true,
		locationResolution: {
			mode: "nearest-location",
			cacheFallback: false,
			selectedLocation: { name: "Oban" },
			distanceMetres: 250,
		},
		source: { provider: "Primary live provider", cache: "network" },
		sources: [
			{ provider: "Primary live provider", cache: "network", valid: true },
			{ provider: "Secondary cached provider", cache: "fallback", valid: true },
		],
	});
	assert.equal(mixedProviders.cachedFallback, false);
	assert.equal(mixedProviders.selection, "Nearest weather location");
	assert.equal(mixedProviders.fallbackMessage, "");
});

test("anchoring prompt requires an explicit current backend suggestion", () => {
	assert.match(anchoringSuggestionText({
		state: "suggested", suggestionId: "suggestion", location: { name: "North Bay" },
	}), /stationary at North Bay/);
	assert.equal(anchoringSuggestionText({ state: "observing", location: { name: "North Bay" } }), "");
});

test("tide curve renders labelled extremes and the calculation reference", () => {
	const svg = tideCurveSvg([
		{ at: "2026-08-18T00:00:00Z", type: "low", heightM: 1 },
		{ at: "2026-08-18T06:00:00Z", type: "high", heightM: 5 },
		{ at: "2026-08-18T12:00:00Z", type: "low", heightM: 1.2 },
	], "2026-08-18T03:00:00Z");
	assert.match(svg, /aria-label="Predicted tide curve"/);
	assert.match(svg, /class="curve"/);
	assert.match(svg, />Now</);
	assert.match(svg, />5\.0 m</);
	assert.match(svg, /class="extreme extreme-low"/);
	assert.match(svg, /class="extreme extreme-high"/);
	assert.equal((svg.match(/<tspan /g) || []).length, 6);
	assert.equal((svg.match(/dy="16"/g) || []).length, 3);
	const lowPointY = Number(svg.match(/extreme-low">\s*<circle[^>]* cy="([0-9.]+)"/)?.[1]);
	const lowLabelY = Number(svg.match(/extreme-low">[\s\S]*?extreme-height"[^>]* y="([0-9.]+)"/)?.[1]);
	const highPointY = Number(svg.match(/extreme-high">\s*<circle[^>]* cy="([0-9.]+)"/)?.[1]);
	const highLabelY = Number(svg.match(/extreme-high">[\s\S]*?extreme-height"[^>]* y="([0-9.]+)"/)?.[1]);
	assert.ok(lowLabelY > lowPointY, "low-water height should appear below its trough");
	assert.ok(highLabelY < highPointY, "high-water height should appear above its peak");
});

test("tide curve shows all four supplied reference levels and hover geometry", () => {
	const events = [
		{ at: "2026-08-18T00:00:00Z", type: "low", heightM: 1 },
		{ at: "2026-08-18T06:00:00Z", type: "high", heightM: 5 },
	];
	const svg = tideCurveSvg(events, "2026-08-18T03:00:00Z", {
		mhws: 4, mhwn: 2.9, mlwn: 1.8, mlws: 0.7,
	});
	for (const label of ["MHWS 4.0 m", "MHWN 2.9 m", "MLWN 1.8 m", "MLWS 0.7 m"]) assert.match(svg, new RegExp(label));
	assert.equal((svg.match(/class="tide-reference"/g) || []).length, 4);
	assert.match(svg, /class="tide-hover-target"/);
	assert.match(svg, /data-min-time=/);
	assert.match(svg, /data-min-height="0"/);
	assert.match(svg, /class="axis-label"[^>]*>0 m</);
	const plotBottom = Number(svg.match(/data-plot-bottom="([0-9.]+)"/)?.[1]);
	const mlwsY = Number(svg.match(/tide-reference-mlws">\s*<line[^>]* y1="([0-9.]+)"/)?.[1]);
	assert.ok(mlwsY < plotBottom, "MLWS should be visibly above the zero baseline");
	assert.equal(interpolatedTideHeight(events, "2026-08-18T03:00:00Z"), 3);
});

test("distance to fall always uses current height and the next low water", () => {
	assert.equal(distanceToNextLowWater({
		heightNowM: 3.4, trend: "rising", nextLowWater: { heightM: 1.1 },
	}), 2.3);
	assert.equal(distanceToNextLowWater({ heightNowM: 3.4, nextLowWater: null }), null);
});

test("an unavailable selected port cannot display stale measurements from the previous port", () => {
	const labels = tideMeasurementLabels({
		valid: false,
		heightNowM: 3.4,
		trend: "falling",
		nextHighWater: { at: "2026-08-18T12:00:00Z", heightM: 4.8 },
		nextLowWater: { at: "2026-08-18T18:00:00Z", heightM: 1.1 },
		datum: "Chart Datum",
		station: { name: "Previous port", id: "previous" },
		source: { provider: "Previous provider" },
		freshness: { state: "fresh", ageSeconds: 10 },
	});
	assert.deepEqual(new Set(Object.values(labels)), new Set(["—"]));
});

test("a high-water-only station exposes its genuine event without inventing a curve or current height", () => {
	const labels=tideMeasurementLabels({
		valid:false,availability:{ highWater:true,lowWater:false,nextHighWater:true,nextLowWater:false },
		heightNowM:null,nextHighWater:{ at:"2026-08-18T12:00:00Z",heightM:4.8 },
		station:{ name:"High-only station",id:"one" },source:{ provider:"Provider" },freshness:{ state:"fresh",ageSeconds:10 },
	});
	assert.match(labels.nextHigh,/4\.80 m/);
	assert.equal(labels.nextLow,"—");
	assert.equal(labels.heightNow,"—");
	assert.match(labels.station,/High-only station/);
});

test("tide curve has an explicit empty state", () => {
	assert.match(tideCurveSvg([]), /No tidal curve is available/);
});

function fakeControl() {
	const classes = new Set();
	return {
		checked: false,
		disabled: false,
		value: "",
		textContent: "",
		innerHTML: "",
		listeners: {},
		classList: {
			add: (...names) => names.forEach((name) => {
				classes.add(name);
			}),
			remove: (...names) => names.forEach((name) => {
				classes.delete(name);
			}),
			toggle(name, force) {
				if (force === true) classes.add(name);
				else if (force === false) classes.delete(name);
				else if (classes.has(name)) classes.delete(name);
				else classes.add(name);
			},
			contains: (name) => classes.has(name),
		},
		addEventListener(type, listener) {
			this.listeners[type] = listener;
		},
		append() {},
		replaceChildren() {},
		querySelector() {
			return null;
		},
	};
}

function fakeControllerControls() {
	const names = [
		"open",
		"statusPanel",
		"unavailable",
		"detailsPortName",
		"graphPortName",
		"heightNow",
		"trend",
		"nextHigh",
		"nextLow",
		"distanceToFall",
		"datum",
		"station",
		"selectionReason",
		"sourceFreshness",
		"springNeapStatus",
		"springNeapTiming",
		"curve",
		"graphDays",
		"alternativePort",
		"clearPin",
		"refresh",
		"actionStatus",
		"weatherUnavailable",
		"weatherFallback",
		"weatherLocationName",
		"weatherDistanceLabel",
		"weatherDistance",
		"weatherSelection",
		"weatherSourceFreshness",
		"weatherStatus",
		"refreshWeather",
		"showAnchorages",
		"showLocations",
		"showStatus",
		"anchoringSuggestion",
		"anchoringSuggestionText",
		"confirmAnchoring",
		"dismissAnchoring",
	];
	const controls = Object.fromEntries(names.map((name) => [name, fakeControl()]));
	const tableHead = fakeControl();
	const tableBody = fakeControl();
	controls.weatherTable = {
		ownerDocument: {
			createElement() {
				const element = fakeControl();
				element.append = () => {};
				return element;
			},
		},
		querySelector(selector) {
			return selector === "thead" ? tableHead : tableBody;
		},
	};
	return controls;
}

test("controller labels last-known positions and rejects late fresh-position anchoring responses", async (t) => {
	const originalOption = globalThis.Option;
	globalThis.Option = class Option {
		constructor(text, value) {
			this.text = text;
			this.value = value;
		}
	};
	t.after(() => {
		globalThis.Option = originalOption;
	});
	const calls = [];
	const response = (body, ok = true, status = 200) => ({
		ok,
		status,
		json: async () => body,
	});
	let releaseWeather;
	const delayedWeather = new Promise((resolve) => {
		releaseWeather = resolve;
	});
	let anchoringRequestCount = 0;
	let releaseLateAnchoring;
	const delayedAnchoring = new Promise((resolve) => {
		releaseLateAnchoring = resolve;
	});
	const fetchFn = async (url) => {
		calls.push(url);
		if (url.includes("/weather/nearest")) {
			return delayedWeather;
		}
		if (url.includes("/tides/status")) {
			return response({
				valid: true,
				selectedPort: { name: "Oban" },
				selection: { reason: "nearestPortInTidalRegion", pinned: false },
				availability: {},
				heightNowM: 2.3,
				trend: "rising",
				curve: [],
			});
		}
		if (url.includes("/anchoring/status")) {
			anchoringRequestCount += 1;
			if (anchoringRequestCount > 1) return delayedAnchoring;
			return response({
				state: "suggested",
				suggestionId: "browser-test-suggestion",
				location: { name: "Browser Test Anchorage" },
			});
		}
		return response({ locations: [] });
	};
	const layer = {
		addTo() {},
		clearLayers() {},
		removeFrom() {},
	};
	const controls = fakeControllerControls();
	const controller = createLocationTideController({
		L: { layerGroup: () => ({ ...layer }) },
		map: {
			hasLayer: () => false,
		},
		controls,
		fetchFn,
		storage: { getItem: () => null, setItem() {} },
		windowObject: {
			setInterval: () => 1,
			clearInterval() {},
		},
	});
	controller.init();
	assert.deepEqual(calls, [
		"/plugins/signalk-ajrm-marine-location-editor/locations?workspace=all",
	]);
	assert.equal(controls.statusPanel.classList.contains("d-none"), true);
	assert.match(controls.unavailable.textContent, /Waiting for the current vessel position/);

	const environmentRequest = controller.notifyPositionChanged({
		latitude: 56.27224,
		longitude: -5.637656,
		lastSeenDate: new Date(Date.now() - 60_000),
	});
	await new Promise((resolve) => setImmediate(resolve));
	assert.ok(calls.some((url) => url.includes("/tides/status?latitude=56.27224")));
	assert.ok(calls.some((url) => url.includes("/weather/nearest?latitude=56.27224")));
	assert.equal(
		controls.weatherDistanceLabel.textContent,
		"Distance from last known position",
	);
	assert.equal(
		calls.some((url) => url.includes("/anchoring/status")),
		false,
		"a retained position must not drive anchoring suggestions",
	);
	assert.match(controls.statusPanel.innerHTML, /2\.30 m/);
	releaseWeather(response({ error: "Weather Database is not installed." }, false, 404));
	await environmentRequest;
	assert.match(controls.weatherUnavailable.textContent, /Weather Database is not installed/);

	const tideRequestsBeforeFresh = calls.filter((url) =>
		url.includes("/tides/status"),
	).length;
	await controller.notifyPositionChanged({
		isStale: false,
		isLost: false,
		latitude: 56.27224,
		longitude: -5.637656,
		lastSeenDate: new Date(),
	});
	assert.equal(
		calls.filter((url) => url.includes("/tides/status")).length,
		tideRequestsBeforeFresh + 1,
	);
	assert.equal(controls.weatherDistanceLabel.textContent, "Distance from vessel");
	assert.ok(calls.some((url) => url.includes("/anchoring/status")));
	assert.equal(
		controls.anchoringSuggestion.classList.contains("d-none"),
		false,
	);

	controller.notifyPositionChanged({
		isStale: true,
		isLost: true,
		latitude: 56.27224,
		longitude: -5.637656,
	});
	assert.equal(
		controls.anchoringSuggestion.classList.contains("d-none"),
		true,
		"a fresh-position anchoring suggestion must clear immediately when GPS is lost",
	);

	const pendingFreshRequest = controller.notifyPositionChanged({
		isStale: false,
		isLost: false,
		latitude: 56.27224,
		longitude: -5.637656,
		lastSeenDate: new Date(),
	});
	await new Promise((resolve) => setImmediate(resolve));
	assert.equal(anchoringRequestCount, 2);
	controller.notifyPositionChanged({
		isStale: true,
		isLost: true,
		latitude: 56.27224,
		longitude: -5.637656,
	});
	releaseLateAnchoring(response({
		state: "suggested",
		suggestionId: "late-suggestion",
		location: { name: "Late Anchorage" },
	}));
	await pendingFreshRequest;
	assert.equal(
		controls.anchoringSuggestion.classList.contains("d-none"),
		true,
		"a late fresh-position response must not repopulate a suggestion after GPS becomes last-known",
	);
	assert.equal(controls.anchoringSuggestionText.textContent, "");
});
