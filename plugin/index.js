/**
 * Signal K server entry point for AJRM Marine Display; registers lifecycle, subscriptions, routes, and status.
 */

"use strict";

const { randomUUID } = require("node:crypto");
const os = require("node:os");
const path = require("node:path");
const packageInfo = require("../package.json");
const openApi = require("./openApi.json");
const defaultProfiles = require("./defaultDisplayProfiles.json");
const {
  alertEvents,
  browserSpeechEvents,
  displayTargets,
  panelEvents,
  profiles,
  uiState,
  valueOf,
} = require("./lib/compatibility");
const { loadLocationProfileAreas } = require("./lib/location-profile-areas");
const { createRouteManager } = require("./lib/route-manager");
const {
  loadAnchorMark,
  removeAnchorMark,
  saveAnchorMark,
} = require("./lib/anchor-mark");

const PLUGIN_ID = "signalk-ajrm-marine-display";
const LOCATIONS_SERVICE_CONTRACT = "ajrm-marine-locations-service-v1";
const TIDAL_DATABASE_SERVICE_CONTRACT = "ajrm-marine-tidal-database-service-v2";
const WEATHER_DATABASE_SERVICE_CONTRACT = "ajrm-marine-weather-database-service-v1";
const STATUS_PATH = "plugins.ajrmMarineDisplay";
const OBSERVATION_SOURCE = "ajrm-marine-display";
const AJRM_MARINE_CAPTURE_API_REGISTRY = Symbol.for(
  "mcdonaldajr.ajrmMarineCaptureApi",
);
const AJRM_MARINE_DISPLAY_API_REGISTRY = Symbol.for(
  "mcdonaldajr.ajrmMarineDisplayApi",
);
const AJRM_MARINE_TRAFFIC_API_REGISTRY = Symbol.for("ajrmMarineTrafficApi");
const DISTANCE_METADATA_PATHS = [
  "navigation.closestApproach.distance",
  "navigation.courseGreatCircle.distance",
  "navigation.courseRhumbline.distance",
];
const DEFAULT_DEBUG_CONTROLS = Object.freeze({
  markerUpdates: true,
  courseLines: true,
  footprints: true,
  labels: true,
  targetTable: true,
  rangeRings: true,
  autoCharts: true,
  harbourLayer: true,
  mapContainer: true,
  tilePane: true,
  overlayPane: true,
  shadowPane: true,
  markerPane: true,
  tooltipPane: true,
  popupPane: true,
});
const DEFAULT_ROUTE_DIRECTORY = "~/AJRMMarineRoutes";
const ROUTE_STATE_FILE = path.join(
  os.homedir(),
  ".signalk",
  "plugin-config-data",
  PLUGIN_ID,
  "active-route.json",
);

module.exports = function ajrmMarineDisplay(app) {
  const plugin = {};
  let options = normalizeOptions({});
  let status = null;
  let debugControls = normalizeDebugControls({});
  let routeManager = null;
  let routeManagerReady = Promise.resolve();
  let anchorMark = null;
  let running = false;
  let lifecycleGeneration = 0;

  plugin.id = PLUGIN_ID;
  plugin.name = "AJRM Marine Display";
  plugin.description =
    "Operational chart and alert display consuming AJRM Marine Traffic, Notifications, and Audio.";
  plugin.schema = {
    type: "object",
    properties: {
      enabled: {
        type: "boolean",
        title: "Enable AJRM Marine Display",
        description: "Allow the Display web app to consume and present Signal K data.",
        default: true,
      },
      refreshIntervalMs: {
        type: "integer",
        title: "Data refresh interval (ms)",
        default: 1000,
        minimum: 500,
        maximum: 10000,
      },
      defaultLatitude: {
        type: "number",
        title: "Fallback map latitude",
        default: 56.45,
        minimum: -90,
        maximum: 90,
      },
      defaultLongitude: {
        type: "number",
        title: "Fallback map longitude",
        default: -5.45,
        minimum: -180,
        maximum: 180,
      },
      defaultZoom: {
        type: "integer",
        title: "Fallback map zoom",
        default: 10,
        minimum: 2,
        maximum: 18,
      },
      coordinateFormat: {
        type: "string",
        title: "Latitude/longitude display format",
        description:
          "Default coordinate format for Display browsers. A browser can override it immediately in Display Settings.",
        default: "dms",
        enum: ["dms", "degrees-minutes", "decimal"],
        enumNames: [
          "Degrees minutes seconds",
          "Degrees decimal minutes",
          "Decimal degrees",
        ],
      },
      browserRefreshDiagnostics: {
        type: "boolean",
        title: "Enable browser refresh diagnostics",
        description:
          "When Signal K plugin debug logging is enabled, record slow Display browser refresh timings through the plugin debug log.",
        default: false,
      },
      routeDirectory: {
        type: "string",
        title: "GPX route directory on the Signal K server",
        description:
          "Display lists and saves GPX 1.1 route files in this directory. Signal K v2 route resources remain the canonical server-side route records.",
        default: DEFAULT_ROUTE_DIRECTORY,
      },
    },
  };

  plugin.start = (pluginOptions = {}) => {
    clearRuntimeApi();
    running = true;
    lifecycleGeneration += 1;
    const generation = lifecycleGeneration;
    options = normalizeOptions(pluginOptions);
    anchorMark = loadAnchorMark(app);
    routeManager = createRouteManager({
      resourcesApi: app.resourcesApi,
      routeDirectory: options.routes.directory,
      stateFile: ROUTE_STATE_FILE,
      onSelection: recordRouteSelection,
    });
    routeManagerReady = routeManager.init().catch((error) => {
      if (!running || generation !== lifecycleGeneration) return null;
      app.error?.(`[${PLUGIN_ID}] route manager startup failed: ${error.message}`);
      return null;
    });
    status = {
      contract: "ajrm-marine-display-status",
      contractVersion: 1,
      sessionId: randomUUID(),
      sequence: 1,
      enabled: options.enabled,
      version: packageInfo.version,
      locationsService: LOCATIONS_SERVICE_CONTRACT,
      tideService: TIDAL_DATABASE_SERVICE_CONTRACT,
      weatherService: WEATHER_DATABASE_SERVICE_CONTRACT,
      defaults: options.defaults,
      diagnostics: options.diagnostics,
      routes: {
        directory: options.routes.directory,
        active: null,
      },
      anchor: {
        active: Boolean(anchorMark),
        mark: anchorMark,
      },
      updatedAt: new Date().toISOString(),
    };
    publish(status);
    const api = {
      pluginId: plugin.id,
      status: () => status,
      panelEvents: () => panelEvents(brokerProjection()),
      alertEvents: () => ({ events: alertEvents(brokerProjection()) }),
      uiState: () => currentUiState(),
      profileAreas: () => loadLocationProfileAreas(app),
      anchorReference: () =>
        anchorMark
          ? {
              position: { ...anchorMark.position },
              droppedAt: anchorMark.droppedAt,
              provenance: "manual-anchor-mark",
            }
          : null,
      async currentRoute() {
        await routeManagerReady;
        return running && generation === lifecycleGeneration
          ? routeManager?.current() || null
          : null;
      },
      async restoreRoute(snapshot) {
        await routeManagerReady;
        return running && generation === lifecycleGeneration
          ? routeManager?.restore(snapshot, { notify: false }) || null
          : null;
      },
      async selectTransientRoute({ resource, fileName = null, source = "external" } = {}) {
        await routeManagerReady;
        return running && generation === lifecycleGeneration
          ? routeManager?.openExternal({ resource, fileName, source }) || null
          : null;
      },
    };
    app.ajrmMarineDisplayApi = api;
    globalThis[AJRM_MARINE_DISPLAY_API_REGISTRY] = api;
    syncAnchorReference();
    app.setPluginStatus(
      status.enabled
        ? `Enabled v${packageInfo.version}; AJRM Marine Traffic display`
        : `Disabled by configuration v${packageInfo.version}`,
    );
  };

  plugin.stop = () => {
    running = false;
    lifecycleGeneration += 1;
    clearRuntimeApi();
    publish(null);
    app.setPluginStatus?.("Stopped");
    status = null;
    routeManager = null;
    routeManagerReady = Promise.resolve(null);
    anchorMark = null;
  };

  plugin.registerWithRouter = (router) => registerRoutes(router);
  plugin.signalKApiRoutes = (router) => {
    registerRoutes(router, "/ajrmMarineDisplay");
    return router;
  };
  plugin.getOpenApi = () => openApi;

  return plugin;

  function registerRoutes(router, prefix = "") {
    const route = (path) => `${prefix}${path}`;
    const write = requireWriteAccess;
    router.get(route("/status"), (_req, res) =>
      res.json({ ok: true, plugin: PLUGIN_ID, status }),
    );
    router.get(route("/getTargets"), (_req, res) =>
      res.json(displayTargets(trafficTargets(), { distanceUnit: preferredDistanceUnit() })),
    );
    router.get(route("/getCollisionProfiles"), (_req, res) =>
      res.json(profiles(defaultProfiles, currentProfile(), trafficProfiles())),
    );
    router.get(route("/anchor"), (_req, res) => res.json(currentAnchorStatus()));
    router.post?.(route("/anchor/drop"), write((_req, res) => {
      try {
        res.json(dropAnchor());
      } catch (error) {
        res.status(409).json({ ok: false, error: error.message });
      }
    }));
    router.post?.(route("/anchor/clear"), write((_req, res) => {
      try {
        res.json(clearAnchor());
      } catch (error) {
        res.status(409).json({ ok: false, error: error.message });
      }
    }));
    router.get(route("/uiState"), (_req, res) => res.json(currentUiState()));
    router.get(route("/panelEvents"), (_req, res) =>
      res.json(panelEvents(brokerProjection())),
    );
    router.get(route("/alertEvents"), (_req, res) =>
      res.json({ events: alertEvents(brokerProjection()) }),
    );
    router.get(route("/announcementLog"), (_req, res) =>
      res.json(currentUiState().announcementLog),
    );
    router.get(route("/browserSpeechEvents"), (_req, res) => {
      const events = browserSpeechEvents(brokerProjection());
      res.json({ events, summary: { count: events.length } });
    });
    router.get(route("/autoProfileStatus"), (_req, res) =>
      res.json(currentUiState().autoProfileStatus),
    );
    router.get(route("/debugControls"), (_req, res) =>
      res.json({ ok: true, controls: debugControls }),
    );
    router.post?.(route("/debugControls"), write(async (req, res) => {
      debugControls = normalizeDebugControls({
        ...debugControls,
        ...(req.body || {}),
      });
      debug("display.debug.controls", debugControls);
      res.json({ ok: true, controls: debugControls });
    }));
    router.get(route("/repeatIntervals"), (_req, res) => res.json({}));
    router.get(route("/routes"), async (_req, res) => {
      try {
        await routeManagerReady;
        res.set?.("Cache-Control", "no-store");
        res.json({
          ok: true,
          active: routeManager.current(),
          resources: await routeManager.list(),
          piFiles: await routeManager.listPiFiles(),
          routeDirectory: options.routes.directory,
        });
      } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
      }
    });
    router.post?.(route("/routes/import"), write(async (req, res) => {
      await routeAction(res, () => routeManager.importGpx({
        xml: req.body?.gpx,
        fileName: req.body?.fileName,
        routeIndex: req.body?.routeIndex,
        saveToPi: req.body?.saveToPi === true,
      }));
    }));
    router.post?.(route("/routes/open-pi"), write(async (req, res) => {
      await routeAction(res, () => routeManager.openPi(req.body || {}));
    }));
    router.post?.(route("/routes/open-resource"), write(async (req, res) => {
      await routeAction(res, () => routeManager.openResource(req.body || {}));
    }));
    router.post?.(route("/routes/delete-resource"), write(async (req, res) => {
      try {
        await routeManagerReady;
        const result = await routeManager.deleteResource(req.body || {});
        res.json({ ok: true, ...result });
      } catch (error) {
        res.status(409).json({ ok: false, error: error.message });
      }
    }));
    router.post?.(route("/routes/reverse"), write(async (_req, res) => {
      await routeAction(res, () => routeManager.reverse());
    }));
    router.post?.(route("/routes/save"), write(async (req, res) => {
      await routeAction(res, () => routeManager.save(req.body || {}));
    }));
    router.post?.(route("/routes/close"), write(async (_req, res) => {
      await routeAction(res, () => routeManager.close());
    }));
    router.get(route("/routes/export"), async (_req, res) => {
      try {
        await routeManagerReady;
        const exported = await routeManager.exportGpx();
        res.set?.("Content-Type", "application/gpx+xml; charset=utf-8");
        res.set?.(
          "Content-Disposition",
          `attachment; filename="${exported.fileName.replaceAll('"', '')}"`,
        );
        res.send(exported.xml);
      } catch (error) {
        res.status(409).json({ ok: false, error: error.message });
      }
    });
    router.get(route("/profileAreas"), async (_req, res) => {
      try {
        res.set?.("Cache-Control", "no-store");
        res.json({ profileAreas: await loadLocationProfileAreas(app) });
      } catch (error) {
        res.status(503).json({ error: error.message });
      }
    });
    router.post?.(route("/refreshDiagnostics"), write(async (req, res) => {
      try {
        logRefreshDiagnostic(req);
        res.json({ ok: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }));
    router.get(route("/observations/status"), async (_req, res) => {
      try {
        res.json(await observationStatus());
      } catch (error) {
        res.status(500).json({
          ok: false,
          error: error.message || "Unable to read voyage observation status",
        });
      }
    });
    router.post?.(route("/observations"), write(async (req, res) => {
      try {
        const text = normalizeObservationText(req.body?.text);
        const captureApi = getCaptureApi();
        if (typeof captureApi?.appendObservation !== "function") {
          res.status(503).json({
            ok: false,
            error:
              "AJRM Marine Capture observation support is not available.",
          });
          return;
        }
        const result = await captureApi.appendObservation({
          text,
          source: OBSERVATION_SOURCE,
          includeSnapshot: req.body?.includeSnapshot === true,
        });
        res.json({
          ok: true,
          observation: result?.observation || result,
        });
      } catch (error) {
        res.status(409).json({
          ok: false,
          error: error.message || "Unable to save voyage observation",
        });
      }
    }));
  }

  async function routeAction(res, action) {
    try {
      await routeManagerReady;
      const active = await action();
      res.json({ ok: true, active });
    } catch (error) {
      res.status(409).json({ ok: false, error: error.message });
    }
  }

  async function recordRouteSelection(selection) {
    if (!running) return;
    const captureApi = getCaptureApi();
    if (typeof captureApi?.recordRouteSelection !== "function") return;
    try {
      await captureApi.recordRouteSelection(selection);
    } catch (error) {
      app.debug?.(`[${PLUGIN_ID}] route selection was not added to voyage: ${error.message}`);
    }
  }

  async function observationStatus() {
    const captureApi = getCaptureApi();
    const captureAvailable =
      typeof captureApi?.appendObservation === "function";
    if (!captureAvailable) {
      return {
        ok: true,
        captureAvailable: false,
        voyageActive: false,
        voyageId: null,
        snapshotAvailable: false,
      };
    }
    const captureStatus =
      typeof captureApi.status === "function"
        ? await captureApi.status()
        : null;
    const capabilities = captureStatus?.observationCapabilities;
    return {
      ok: true,
      captureAvailable: capabilities?.available === true,
      voyageActive: Boolean(captureStatus?.currentVoyage?.id),
      voyageId: captureStatus?.currentVoyage?.id || null,
      snapshotAvailable: capabilities?.snapshotAvailable === true,
      maximumTextCharacters:
        Number.isInteger(capabilities?.maximumTextCharacters)
          ? capabilities.maximumTextCharacters
          : null,
    };
  }

  function getCaptureApi() {
    return (
      app.ajrmMarineCaptureApi ||
      globalThis[AJRM_MARINE_CAPTURE_API_REGISTRY] ||
      null
    );
  }

  function currentUiState() {
    return {
      ...uiState({
        trafficProjection: trafficTargets(),
        capabilities: trafficCapabilities(),
        brokerProjection: brokerProjection(),
        audioStatus: valueOf(app.getSelfPath?.("plugins.ajrmMarineAudio")) || {},
        audioPolicy: trafficAudioPolicy(),
        autoProfile: trafficAutoProfile(),
        self: selfVessel(),
        refreshIntervalMs: options.defaults.refreshIntervalMs,
      }),
      anchor: currentAnchorStatus(),
    };
  }

  function currentAnchorStatus() {
    const profile = explicitTrafficProfile();
    if (anchorMark && profile && profile !== "anchor") {
      anchorMark = null;
      removeAnchorMark(app);
      publishCurrentStatus();
    }
    syncAnchorReference();
    return {
      available: true,
      active: Boolean(anchorMark && profile === "anchor"),
      currentProfile: profile,
      mark: anchorMark,
    };
  }

  function dropAnchor() {
    const position = valueOf(app.getSelfPath?.("navigation.position"));
    if (!validPosition(position)) {
      throw new Error("A valid own-vessel position is required to mark the anchor.");
    }
    const depthBelowKeelMeters = Number(
      valueOf(app.getSelfPath?.("environment.depth.belowKeel")),
    );
    if (!Number.isFinite(depthBelowKeelMeters)) {
      throw new Error("A current depth below keel reading is required to mark the anchor.");
    }
    const traffic = trafficApi();
    if (typeof traffic?.setProfile !== "function") {
      throw new Error("AJRM Marine Traffic profile control is unavailable.");
    }
    traffic.setProfile("anchor");
    anchorMark = saveAnchorMark(app, {
      position,
      depthBelowKeelMeters,
      droppedAt: new Date().toISOString(),
    });
    syncAnchorReference();
    publishCurrentStatus();
    return { ok: true, ...currentAnchorStatus() };
  }

  function clearAnchor() {
    const traffic = trafficApi();
    if (typeof traffic?.setProfile !== "function") {
      throw new Error("AJRM Marine Traffic profile control is unavailable.");
    }
    traffic.setProfile("coastal");
    anchorMark = null;
    removeAnchorMark(app);
    syncAnchorReference();
    publishCurrentStatus();
    return { ok: true, ...currentAnchorStatus() };
  }

  function trafficApi() {
    return app.ajrmMarineTrafficApi || globalThis[AJRM_MARINE_TRAFFIC_API_REGISTRY] || null;
  }

  function syncAnchorReference() {
    const traffic = trafficApi();
    if (typeof traffic?.setAnchorReference !== "function") return;
    traffic.setAnchorReference(
      anchorMark
        ? {
            position: anchorMark.position,
            droppedAt: anchorMark.droppedAt,
            provenance: "manual-anchor-mark",
          }
        : null,
    );
  }

  function explicitTrafficProfile() {
    const apiProfile = trafficApi()?.status?.()?.profiles?.current;
    const projectionProfile =
      trafficProfiles()?.current ||
      trafficCapabilities()?.profile ||
      trafficTargets()?.profile;
    const profile = String(apiProfile || projectionProfile || "").trim().toLowerCase();
    return ["anchor", "harbor", "coastal", "offshore"].includes(profile)
      ? profile
      : null;
  }

  function publishCurrentStatus() {
    if (!status) return;
    status = {
      ...status,
      sequence: Number(status.sequence || 0) + 1,
      anchor: {
        active: Boolean(anchorMark),
        mark: anchorMark,
      },
      updatedAt: new Date().toISOString(),
    };
    publish(status);
  }

  function validPosition(position) {
    const latitude = Number(position?.latitude);
    const longitude = Number(position?.longitude);
    return (
      Number.isFinite(latitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      Number.isFinite(longitude) &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  function trafficTargets() {
    return valueOf(app.getSelfPath?.("plugins.ajrmMarineTraffic.targets")) || {};
  }

  function trafficCapabilities() {
    return valueOf(app.getSelfPath?.("plugins.ajrmMarineTraffic.capabilities")) || {};
  }

  function trafficProfiles() {
    return valueOf(app.getSelfPath?.("plugins.ajrmMarineTraffic.profiles")) || {};
  }

  function trafficAutoProfile() {
    return valueOf(app.getSelfPath?.("plugins.ajrmMarineTraffic.autoProfile")) || {};
  }

  function trafficAudioPolicy() {
    return valueOf(app.getSelfPath?.("plugins.ajrmMarineTraffic.audioPolicy")) || {};
  }

  function brokerProjection() {
    return valueOf(app.getSelfPath?.("plugins.ajrmMarineNotifications")) || {};
  }

  function currentProfile() {
    return trafficTargets().profile || trafficCapabilities().profile || "harbor";
  }

  function selfVessel() {
    return {
      mmsi: app.getSelfPath?.("mmsi"),
      name: app.getSelfPath?.("name"),
      navigation: {
        position: app.getSelfPath?.("navigation.position"),
        speedOverGround: app.getSelfPath?.("navigation.speedOverGround"),
        courseOverGroundTrue: app.getSelfPath?.(
          "navigation.courseOverGroundTrue",
        ),
        headingTrue: app.getSelfPath?.("navigation.headingTrue"),
      },
    };
  }

  function preferredDistanceUnit() {
    for (const pathName of DISTANCE_METADATA_PATHS) {
      const metadata = app.getMetadata?.(pathName);
      const unit =
        metadata?.displayUnits?.targetUnit ||
        metadata?.displayUnits?.units ||
        metadata?.displayUnits?.symbol;
      if (unit) return unit;
    }
    return "nmi";
  }

  function publish(value) {
    app.handleMessage(PLUGIN_ID, {
      context: "vessels.self",
      updates: [{ values: [{ path: STATUS_PATH, value }] }],
    });
  }

  function clearRuntimeApi() {
    if (app.ajrmMarineDisplayApi?.pluginId === plugin.id) {
      delete app.ajrmMarineDisplayApi;
    }
    if (globalThis[AJRM_MARINE_DISPLAY_API_REGISTRY]?.pluginId === plugin.id) {
      delete globalThis[AJRM_MARINE_DISPLAY_API_REGISTRY];
    }
  }

  function requireWriteAccess(handler) {
    return function writeAccessHandler(req, res) {
      const permission = req.skPrincipal?.permissions;
      if (
        permission === "admin" ||
        permission === "readwrite" ||
        (permission === undefined && req.skIsAuthenticated !== false)
      ) {
        return handler(req, res);
      }
      res.status(403).json({
        ok: false,
        error: "AJRM Marine Display controls require Signal K read/write or admin access.",
      });
      return undefined;
    };
  }

  function logRefreshDiagnostic(req) {
    const entry = refreshDiagnosticEntry(req);
    if (entry.sample.diagnosticType === "browser-performance") {
      logBrowserPerformanceDiagnostic(entry);
      return;
    }
    const slow = entry.sample.diagnosticReason === "slow";
    debug(slow ? "display.refresh.slow" : "display.refresh.sample", {
      reason: entry.sample.diagnosticReason,
      totalMs: entry.sample.totalMs,
      summary: entry.sample.summary,
      targets: entry.sample.counts?.targets,
      markers: entry.sample.counts?.boatMarkers,
      layers: entry.sample.counts?.layerCount,
      replayActive: entry.sample.replayActive,
      replayPaused: entry.sample.replayPaused,
      skippedRefreshes: entry.sample.skippedRefreshes,
      slowest: slowestPhaseText(entry.sample.slowestPhases),
      userAgent: entry.userAgent,
    });
  }

  function logBrowserPerformanceDiagnostic(entry) {
    const reason = stringOrEmpty(entry.sample.diagnosticReason) || "sample";
    debug(`display.browser.${reason}`, {
      reason,
      totalMs: entry.sample.totalMs,
      eventLoopLagMs: entry.sample.eventLoopLagMs,
      frameGapMs: entry.sample.frameGapMs,
      maxEventLoopLagMs: entry.sample.maxEventLoopLagMs,
      maxFrameGapMs: entry.sample.maxFrameGapMs,
      visibilityState: entry.sample.visibilityState,
      summary: entry.sample.summary,
      userAgent: entry.userAgent,
    });
  }

  function debug(event, fields) {
    app.debug?.(
      `[${PLUGIN_ID}] event=${event} ${Object.entries(fields)
        .map(([key, value]) => `${key}=${stringOrEmpty(value)}`)
        .join(" ")}`,
    );
  }
};

function normalizeOptions(value) {
  return {
    enabled: value.enabled !== false,
    defaults: {
      refreshIntervalMs: clamp(value.refreshIntervalMs, 500, 10000, 1000),
      latitude: clamp(value.defaultLatitude, -90, 90, 56.45),
      longitude: clamp(value.defaultLongitude, -180, 180, -5.45),
      zoom: Math.round(clamp(value.defaultZoom, 2, 18, 10)),
      coordinateFormat: normalizeCoordinateFormat(value.coordinateFormat),
    },
    diagnostics: {
      browserRefreshDiagnostics: value.browserRefreshDiagnostics === true,
    },
    routes: {
      directory: expandHome(value.routeDirectory || DEFAULT_ROUTE_DIRECTORY),
    },
  };
}

function normalizeCoordinateFormat(value) {
  return ["dms", "degrees-minutes", "decimal"].includes(value)
    ? value
    : "dms";
}

function expandHome(value) {
  const text = String(value || "").trim();
  if (text === "~") return os.homedir();
  if (text.startsWith("~/")) return path.join(os.homedir(), text.slice(2));
  return path.resolve(text || path.join(os.homedir(), "AJRMMarineRoutes"));
}

function normalizeDebugControls(value = {}) {
  return Object.fromEntries(
    Object.entries(DEFAULT_DEBUG_CONTROLS).map(([key, fallback]) => [
      key,
      value[key] !== undefined ? value[key] === true : fallback,
    ]),
  );
}

function clamp(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(maximum, Math.max(minimum, number))
    : fallback;
}

function refreshDiagnosticEntry(req) {
  const body = req?.body && typeof req.body === "object" ? req.body : {};
  const sample = body.sample && typeof body.sample === "object" ? body.sample : {};
  return {
    contract: "ajrm-marine-display-refresh-diagnostic",
    contractVersion: 1,
    receivedAt: new Date().toISOString(),
    userAgent: stringOrEmpty(body.userAgent).slice(0, 300),
    sample,
  };
}

function slowestPhaseText(phases) {
  return Array.isArray(phases)
    ? phases.map((phase) => `${phase.name}:${phase.ms}`).join(",")
    : "";
}

function stringOrEmpty(value) {
  if (value === null || value === undefined) return "";
  return String(value).replaceAll(/\s+/g, "_").slice(0, 300);
}

function normalizeObservationText(value) {
  if (typeof value !== "string") {
    throw new Error("Enter an observation before saving.");
  }
  const text = value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
  if (!text) throw new Error("Enter an observation before saving.");
  if (text.length > 2000) {
    throw new Error("Voyage observations are limited to 2000 characters.");
  }
  return text;
}
