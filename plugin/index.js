"use strict";

const { randomUUID } = require("node:crypto");
const packageInfo = require("../package.json");
const openApi = require("./openApi.json");
const defaultProfiles = require("./defaultDisplayProfiles.json");
const {
  alertEvents,
  displayTargets,
  panelEvents,
  profiles,
  uiState,
  valueOf,
} = require("./lib/compatibility");
const { loadHarbourRegions } = require("./lib/harbour-regions");

const PLUGIN_ID = "signalk-ajrm-marine-display";
const STATUS_PATH = "plugins.ajrmMarineDisplay";
const DISTANCE_METADATA_PATHS = [
  "navigation.closestApproach.distance",
  "navigation.courseGreatCircle.distance",
  "navigation.courseRhumbline.distance",
];

module.exports = function ajrmMarineDisplay(app) {
  const plugin = {};
  let options = normalizeOptions({});
  let status = null;

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
    },
  };

  plugin.start = (pluginOptions = {}) => {
    options = normalizeOptions(pluginOptions);
    status = {
      contract: "ais-plus-display-status",
      contractVersion: 1,
      sessionId: randomUUID(),
      sequence: 1,
      enabled: options.enabled,
      version: packageInfo.version,
      defaults: options.defaults,
      updatedAt: new Date().toISOString(),
    };
    publish(status);
    app.setPluginStatus(
      status.enabled
        ? `Enabled v${packageInfo.version}; Traffic Core display`
        : `Disabled by configuration v${packageInfo.version}`,
    );
  };

  plugin.stop = () => {
    status = null;
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
    router.get(route("/status"), (_req, res) =>
      res.json({ ok: true, plugin: PLUGIN_ID, status }),
    );
    router.get(route("/getTargets"), (_req, res) =>
      res.json(displayTargets(engineTargets(), { distanceUnit: preferredDistanceUnit() })),
    );
    router.get(route("/getCollisionProfiles"), (_req, res) =>
      res.json(profiles(defaultProfiles, currentProfile(), engineProfiles())),
    );
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
    router.get(route("/browserSpeechEvents"), (_req, res) =>
      res.json({ events: [], summary: { count: 0 } }),
    );
    router.get(route("/autoProfileStatus"), (_req, res) =>
      res.json(currentUiState().autoProfileStatus),
    );
    router.get(route("/autoProfileSettings"), (_req, res) =>
      res.json(engineAutoProfile().settings || { enabled: false }),
    );
    router.get(route("/getSpeechOutputSettings"), (_req, res) =>
      res.json(currentUiState().speechOutput),
    );
    router.get(route("/encounterSettings"), (_req, res) =>
      res.json({
        useVesselShapeForCpa: true,
        displayScaledVesselShapes: true,
        allWellEnabled: false,
      }),
    );
    router.get(route("/repeatIntervals"), (_req, res) => res.json({}));
    router.get(route("/harbourRegions"), async (_req, res) => {
      try {
        res.set?.("Cache-Control", "no-store");
        const prefix =
          engineAutoProfile().settings?.harbourRegionNamePrefix || "Harbour:";
        const regions = await loadHarbourRegions({
          resourcesApi: app.resourcesApi,
          prefix,
        });
        res.json({ regions });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  function currentUiState() {
    return uiState({
      engineProjection: engineTargets(),
      capabilities: engineCapabilities(),
      brokerProjection: brokerProjection(),
      audioStatus: valueOf(app.getSelfPath?.("plugins.ajrmMarineAudio")) || {},
      audioPolicy: engineAudioPolicy(),
      autoProfile: engineAutoProfile(),
      self: selfVessel(),
      refreshIntervalMs: options.defaults.refreshIntervalMs,
    });
  }

  function engineTargets() {
    return valueOf(app.getSelfPath?.("plugins.ajrmMarineTraffic.targets")) || {};
  }

  function engineCapabilities() {
    return valueOf(app.getSelfPath?.("plugins.ajrmMarineTraffic.capabilities")) || {};
  }

  function engineProfiles() {
    return valueOf(app.getSelfPath?.("plugins.ajrmMarineTraffic.profiles")) || {};
  }

  function engineAutoProfile() {
    return valueOf(app.getSelfPath?.("plugins.ajrmMarineTraffic.autoProfile")) || {};
  }

  function engineAudioPolicy() {
    return valueOf(app.getSelfPath?.("plugins.ajrmMarineTraffic.audioPolicy")) || {};
  }

  function brokerProjection() {
    return valueOf(app.getSelfPath?.("plugins.ajrmMarineNotifications")) || {};
  }

  function currentProfile() {
    return engineTargets().profile || engineCapabilities().profile || "harbor";
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
};

function normalizeOptions(value) {
  return {
    enabled: value.enabled !== false,
    defaults: {
      refreshIntervalMs: clamp(value.refreshIntervalMs, 500, 10000, 1000),
      latitude: clamp(value.defaultLatitude, -90, 90, 56.45),
      longitude: clamp(value.defaultLongitude, -180, 180, -5.45),
      zoom: Math.round(clamp(value.defaultZoom, 2, 18, 10)),
    },
  };
}

function clamp(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(maximum, Math.max(minimum, number))
    : fallback;
}
