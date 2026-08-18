"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const createPlugin = require("../plugin/index.js");
const packageInfo = require("../package.json");

function harness(paths = {}, resources = {}, metadata = {}, appExtras = {}) {
  const messages = [];
  const statuses = [];
  const debugMessages = [];
  const app = {
    handleMessage: (_id, message) => messages.push(message),
    setPluginStatus: (status) => statuses.push(status),
    debug: (message) => debugMessages.push(message),
    getSelfPath: (path) => paths[path],
    getMetadata: (path) => metadata[path],
    resourcesApi: {
      listResources: async () => resources,
    },
    ...appExtras,
  };
  return { app, plugin: createPlugin(app), messages, statuses, debugMessages };
}

function routeHarness() {
  const routes = new Map();
  return {
    routes,
    router: {
      get: (path, handler) => routes.set(`GET ${path}`, handler),
      post: (path, handler) => routes.set(`POST ${path}`, handler),
    },
  };
}

test("plugin exposes an enabled-by-default Display setting", () => {
  const { plugin } = harness();
  assert.equal(plugin.id, "signalk-ajrm-marine-display");
  assert.equal(plugin.schema.properties.enabled.default, true);
  assert.equal(plugin.schema.properties.refreshIntervalMs.default, 1000);
  assert.equal(plugin.schema.properties.coordinateFormat.default, "dms");
  assert.deepEqual(plugin.schema.properties.coordinateFormat.enum, [
    "dms",
    "degrees-minutes",
    "decimal",
  ]);
  assert.equal(plugin.getOpenApi().info.version, packageInfo.version);
});

test("runtime API exposes the active-only alert panel projection for BITE", () => {
  const paths = {
    "plugins.ajrmMarineNotifications": {
      active: [],
      recentActivity: [{
        eventId: "resolved-traffic",
        lifecycle: "clear",
        message: "Historical traffic advisory.",
      }],
    },
  };
  const appExtras = {};
  const { plugin } = harness(paths, {}, {}, appExtras);
  plugin.start({});
  const api = globalThis[Symbol.for("mcdonaldajr.ajrmMarineDisplayApi")];
  assert.equal(typeof api?.panelEvents, "function");
  assert.deepEqual(api.panelEvents().entries, []);
  plugin.stop();
  assert.equal(globalThis[Symbol.for("mcdonaldajr.ajrmMarineDisplayApi")], undefined);
});

test("Signal K compatibility API returns Harbour region geometry", async () => {
  const geometry = {
    type: "Polygon",
    coordinates: [
      [
        [-5.5, 56.4],
        [-5.4, 56.4],
        [-5.4, 56.5],
        [-5.5, 56.4],
      ],
    ],
  };
  const { plugin } = harness(
    {
      "plugins.ajrmMarineTraffic.autoProfile": {
        settings: { harbourRegionNamePrefix: "Harbour:" },
      },
    },
    {
      oban: { name: "Harbour: Oban", geometry },
      other: { name: "Cruising area", geometry },
    },
  );
  const { router, routes } = routeHarness();
  plugin.signalKApiRoutes(router);
  let body;
  await routes.get("GET /ajrmMarineDisplay/harbourRegions")(
    {},
    {
      set() {},
      status() {
        return this;
      },
      json(value) {
        body = value;
      },
    },
  );
  assert.deepEqual(body, {
    regions: [{ id: "oban", name: "Harbour: Oban", geometry }],
  });
});

test("Signal K compatibility API writes refresh diagnostics through app.debug", async () => {
  const { plugin, debugMessages } = harness();
  const { router, routes } = routeHarness();
  plugin.signalKApiRoutes(router);
  let body;

  await routes.get("POST /ajrmMarineDisplay/refreshDiagnostics")(
    {
      body: {
        userAgent: "node-test",
        sample: {
          diagnosticReason: "slow",
          totalMs: 954,
          phases: { "fetch-vessels": 188, "render-ui": 500 },
          counts: { targets: 13, boatMarkers: 13 },
          summary: "total=954ms",
        },
      },
    },
    {
      json(value) {
        body = value;
      },
      status() {
        return this;
      },
    },
  );

  assert.equal(body.ok, true);
  assert.equal(debugMessages.length, 1);
  assert.match(debugMessages[0], /event=display\.refresh\.slow/);
  assert.match(debugMessages[0], /reason=slow/);
  assert.match(debugMessages[0], /totalMs=954/);
  assert.match(debugMessages[0], /targets=13/);
  assert.match(debugMessages[0], /userAgent=node-test/);
});

test("Signal K compatibility API writes periodic refresh samples through app.debug", async () => {
  const { plugin, debugMessages } = harness();
  const { router, routes } = routeHarness();
  plugin.signalKApiRoutes(router);

  await routes.get("POST /ajrmMarineDisplay/refreshDiagnostics")(
    {
      body: {
        userAgent: "node-test",
        sample: {
          diagnosticReason: "periodic",
          totalMs: 48,
          counts: { targets: 2, boatMarkers: 1 },
          summary: "total=48ms",
        },
      },
    },
    {
      json() {},
      status() {
        return this;
      },
    },
  );

  assert.match(debugMessages[0], /event=display\.refresh\.sample/);
  assert.match(debugMessages[0], /reason=periodic/);
  assert.match(debugMessages[0], /totalMs=48/);
});

test("Signal K compatibility API writes browser performance diagnostics through app.debug", async () => {
  const { plugin, debugMessages } = harness();
  const { router, routes } = routeHarness();
  plugin.signalKApiRoutes(router);

  await routes.get("POST /ajrmMarineDisplay/refreshDiagnostics")(
    {
      body: {
        userAgent: "node-test",
        sample: {
          diagnosticType: "browser-performance",
          diagnosticReason: "frame-gap",
          totalMs: 382,
          eventLoopLagMs: 0,
          frameGapMs: 382,
          maxEventLoopLagMs: 74,
          maxFrameGapMs: 382,
          visibilityState: "visible",
          summary: "reason=frame-gap; frameGap=382ms",
        },
      },
    },
    {
      json() {},
      status() {
        return this;
      },
    },
  );

  assert.match(debugMessages[0], /event=display\.browser\.frame-gap/);
  assert.match(debugMessages[0], /frameGapMs=382/);
  assert.match(debugMessages[0], /maxEventLoopLagMs=74/);
  assert.match(debugMessages[0], /visibilityState=visible/);
});

test("Signal K compatibility API exposes runtime Display debug controls", async () => {
  const { plugin, debugMessages } = harness();
  const { router, routes } = routeHarness();
  plugin.signalKApiRoutes(router);
  const responses = [];

  await routes.get("GET /ajrmMarineDisplay/debugControls")(
    {},
    { json(value) { responses.push(value); } },
  );
  await routes.get("POST /ajrmMarineDisplay/debugControls")(
    { body: { footprints: false, labels: false, rangeRings: false, tilePane: false } },
    { json(value) { responses.push(value); } },
  );
  await routes.get("GET /ajrmMarineDisplay/debugControls")(
    {},
    { json(value) { responses.push(value); } },
  );

  assert.equal(responses[0].controls.footprints, true);
  assert.equal(responses[1].controls.footprints, false);
  assert.equal(responses[1].controls.labels, false);
  assert.equal(responses[1].controls.rangeRings, false);
  assert.equal(responses[1].controls.tilePane, false);
  assert.equal(responses[1].controls.markerUpdates, true);
  assert.equal(responses[2].controls.footprints, false);
  assert.match(debugMessages[0], /event=display\.debug\.controls/);
  assert.match(debugMessages[0], /footprints=false/);
  assert.match(debugMessages[0], /rangeRings=false/);
  assert.match(debugMessages[0], /tilePane=false/);
});

test("plugin publishes enabled Display status", () => {
  const { plugin, messages, statuses } = harness();
  plugin.start({});
  const value = messages[0].updates[0].values[0];
  assert.equal(value.path, "plugins.ajrmMarineDisplay");
  assert.equal(value.value.contract, "ajrm-marine-display-status");
  assert.equal(value.value.contractVersion, 1);
  assert.equal(value.value.enabled, true);
  assert.equal(value.value.sequence, 1);
  assert.ok(value.value.sessionId);
  assert.deepEqual(value.value.defaults, {
    refreshIntervalMs: 1000,
    latitude: 56.45,
    longitude: -5.45,
    zoom: 10,
    coordinateFormat: "dms",
  });
  assert.deepEqual(value.value.diagnostics, {
    browserRefreshDiagnostics: false,
  });
  assert.equal(value.value.donor, undefined);
  assert.match(
    statuses[0],
    new RegExp(`^Enabled v${packageInfo.version.replaceAll(".", "\\.")}; AJRM Marine Traffic display$`),
  );
});

test("plugin publishes browser refresh diagnostic setting when enabled", () => {
  const { plugin, messages } = harness();
  plugin.start({ browserRefreshDiagnostics: true });
  const value = messages[0].updates[0].values[0].value;
  assert.equal(value.diagnostics.browserRefreshDiagnostics, true);
});

test("plugin publishes disabled Display status when configured off", () => {
  const { plugin, messages, statuses } = harness();
  plugin.start({ enabled: false });
  assert.equal(messages[0].updates[0].values[0].value.enabled, false);
  assert.match(
    statuses[0],
    new RegExp(`^Disabled by configuration v${packageInfo.version.replaceAll(".", "\\.")}$`),
  );
});

test("plugin retracts its status and runtime API when stopped", () => {
  const { app, plugin, messages, statuses } = harness();

  plugin.start({});
  assert.equal(app.ajrmMarineDisplayApi?.pluginId, plugin.id);

  plugin.stop();

  const value = messages.at(-1).updates[0].values[0];
  assert.equal(value.path, "plugins.ajrmMarineDisplay");
  assert.equal(value.value, null);
  assert.equal(app.ajrmMarineDisplayApi, undefined);
  assert.equal(
    globalThis[Symbol.for("mcdonaldajr.ajrmMarineDisplayApi")],
    undefined,
  );
  assert.equal(statuses.at(-1), "Stopped");
});

test("Signal K API rejects unauthenticated mutations", async () => {
  const { plugin } = harness();
  const { router, routes } = routeHarness();
  plugin.signalKApiRoutes(router);
  let body;
  let statusCode;

  await routes.get("POST /ajrmMarineDisplay/debugControls")(
    {
      skIsAuthenticated: false,
      body: { labels: false },
    },
    {
      json(value) {
        body = value;
      },
      status(value) {
        statusCode = value;
        return this;
      },
    },
  );

  assert.equal(statusCode, 403);
  assert.equal(body.ok, false);
  assert.match(body.error, /read\/write or admin access/);
});

test("OpenAPI documents every registered Signal K route", () => {
  const { plugin } = harness();
  const { router, routes } = routeHarness();
  plugin.registerWithRouter(router);
  const documented = new Set();
  for (const [path, pathItem] of Object.entries(plugin.getOpenApi().paths)) {
    for (const method of ["get", "post"]) {
      if (pathItem[method]) documented.add(`${method.toUpperCase()} ${path}`);
    }
  }
  assert.deepEqual(new Set(routes.keys()), documented);
});

test("Signal K API exposes AJRM Marine Traffic targets under ajrmMarineDisplay", () => {
  const { plugin } = harness({
    "plugins.ajrmMarineTraffic.targets": {
      contract: "ajrm-marine-traffic-targets",
      targets: [
        {
          mmsi: "235000001",
          name: "Ferry Alpha",
          position: { latitude: 56.2, longitude: -5.5 },
          encounter: { state: "warn", cpa: 100, tcpa: 180 },
        },
      ],
    },
  });
  const { router, routes } = routeHarness();
  plugin.signalKApiRoutes(router);
  let body;
  routes.get("GET /ajrmMarineDisplay/getTargets")({}, {
    json: (value) => {
      body = value;
    },
  });
  assert.equal(body["235000001"].alarmState, "warning");
  assert.equal(body["235000001"].cpa, 100);
});

test("Signal K API formats target distances using Signal K display units metadata", () => {
  const { plugin } = harness(
    {
      "plugins.ajrmMarineTraffic.targets": {
        contract: "ajrm-marine-traffic-targets",
        targets: [
          {
            mmsi: "235000001",
            name: "Ferry Alpha",
            encounter: { state: "warn", range: 1667, cpa: 250, tcpa: 180 },
          },
        ],
      },
    },
    {},
    {
      "navigation.closestApproach.distance": {
        displayUnits: { targetUnit: "ft" },
      },
    },
  );
  const { router, routes } = routeHarness();
  plugin.signalKApiRoutes(router);
  let body;
  routes.get("GET /ajrmMarineDisplay/getTargets")({}, {
    json: (value) => {
      body = value;
    },
  });
  assert.equal(body["235000001"].range, 1667);
  assert.equal(body["235000001"].cpa, 250);
  assert.equal(body["235000001"].rangeFormatted, "1.04 mi");
  assert.equal(body["235000001"].cpaFormatted, "820 ft");
});

test("Display observation routes proxy timestamped notes to active Capture voyage", async () => {
  const calls = [];
  const { plugin } = harness({}, {}, {}, {
    ajrmMarineCaptureApi: {
      async status() {
        return {
          currentVoyage: { id: "voyage-20260728T120000Z" },
          observationCapabilities: {
            available: true,
            snapshotAvailable: true,
            maximumTextCharacters: 2000,
          },
        };
      },
      async appendObservation(value) {
        calls.push(value);
        return {
          id: "observation-1",
          recordedAt: "2026-07-28T12:34:56.000Z",
          text: value.text,
        };
      },
    },
  });
  const { router, routes } = routeHarness();
  plugin.signalKApiRoutes(router);

  let statusBody;
  await routes.get("GET /ajrmMarineDisplay/observations/status")(
    {},
    {
      json(value) {
        statusBody = value;
      },
      status() {
        return this;
      },
    },
  );
  assert.deepEqual(statusBody, {
    ok: true,
    captureAvailable: true,
    voyageActive: true,
    voyageId: "voyage-20260728T120000Z",
    snapshotAvailable: true,
    maximumTextCharacters: 2000,
  });

  let postBody;
  await routes.get("POST /ajrmMarineDisplay/observations")(
    {
      body: {
        text: "  Target turn arrow remained visible.  ",
        includeSnapshot: true,
      },
    },
    {
      json(value) {
        postBody = value;
      },
      status() {
        return this;
      },
    },
  );

  assert.deepEqual(calls, [{
    text: "Target turn arrow remained visible.",
    source: "ajrm-marine-display",
    includeSnapshot: true,
  }]);
  assert.equal(postBody.ok, true);
  assert.equal(postBody.observation.id, "observation-1");
});

test("Display observation route rejects non-string text without coercing it", async () => {
  let appendCalls = 0;
  const { plugin } = harness({}, {}, {}, {
    ajrmMarineCaptureApi: {
      async appendObservation() {
        appendCalls += 1;
      },
    },
  });
  const { router, routes } = routeHarness();
  plugin.signalKApiRoutes(router);
  let body;
  let statusCode;

  await routes.get("POST /ajrmMarineDisplay/observations")(
    { body: { text: { unexpected: true }, includeSnapshot: false } },
    {
      json(value) {
        body = value;
      },
      status(value) {
        statusCode = value;
        return this;
      },
    },
  );

  assert.equal(statusCode, 409);
  assert.equal(appendCalls, 0);
  assert.equal(body.ok, false);
  assert.match(body.error, /Enter an observation/);
});

test("Display observation status fails clearly when Capture support is absent", async () => {
  const { plugin } = harness();
  const { router, routes } = routeHarness();
  plugin.signalKApiRoutes(router);
  let body;
  let statusCode;

  await routes.get("GET /ajrmMarineDisplay/observations/status")(
    {},
    {
      json(value) {
        body = value;
      },
      status(value) {
        statusCode = value;
        return this;
      },
    },
  );
  assert.equal(body.captureAvailable, false);
  assert.equal(body.voyageActive, false);

  await routes.get("POST /ajrmMarineDisplay/observations")(
    { body: { text: "Test", includeSnapshot: false } },
    {
      json(value) {
        body = value;
      },
      status(value) {
        statusCode = value;
        return this;
      },
    },
  );
  assert.equal(statusCode, 503);
  assert.equal(body.ok, false);
  assert.match(body.error, /Capture observation support/);
});

test("Display profiles include AJRM Marine Traffic sensitivity settings", () => {
  const { plugin } = harness({
    "plugins.ajrmMarineTraffic.targets": { profile: "coastal" },
    "plugins.ajrmMarineTraffic.profiles": {
      current: "coastal",
      coastal: {
        cpaSensitivity: 1.4,
        tcpaLookahead: 0.8,
        repeatSensitivity: 1.2,
      },
    },
  });
  const { router, routes } = routeHarness();
  plugin.signalKApiRoutes(router);
  let body;
  routes.get("GET /ajrmMarineDisplay/getCollisionProfiles")({}, {
    json: (value) => {
      body = value;
    },
  });
  assert.equal(body.current, "coastal");
  assert.equal(body.coastal.cpaSensitivity, 1.4);
  assert.equal(body.coastal.tcpaLookahead, 0.8);
  assert.equal(body.coastal.repeatSensitivity, 1.2);
  assert.equal(body.coastal.warning.bySize.large.cpa, 2778);
});

test("Display marks a dropped anchor and Un-anchor selects Coastal", () => {
  let profile = "coastal";
  const selectedProfiles = [];
  const anchorReferences = [];
  const paths = {
    "navigation.position": { latitude: 56.45, longitude: -5.45 },
    "environment.depth.belowKeel": 4.2,
  };
  const { plugin } = harness(paths, {}, {}, {
    ajrmMarineTrafficApi: {
      status() {
        return { profiles: { current: profile } };
      },
      setProfile(value) {
        profile = value;
        selectedProfiles.push(value);
        return { current: value };
      },
      setAnchorReference(value) {
        anchorReferences.push(value);
        return { ok: true };
      },
    },
  });
  plugin.start({});
  const { router, routes } = routeHarness();
  plugin.signalKApiRoutes(router);

  let body;
  const response = {
    json(value) { body = value; },
    status() { return this; },
  };
  routes.get("POST /ajrmMarineDisplay/anchor/drop")({}, response);
  assert.deepEqual(selectedProfiles, ["anchor"]);
  assert.equal(body.active, true);
  assert.deepEqual(body.mark.position, paths["navigation.position"]);
  assert.equal(body.mark.depthBelowKeelMeters, 4.2);
  assert.deepEqual(anchorReferences.at(-1), {
    position: paths["navigation.position"],
    droppedAt: body.mark.droppedAt,
    provenance: "manual-anchor-mark",
  });

  routes.get("POST /ajrmMarineDisplay/anchor/clear")({}, response);
  assert.deepEqual(selectedProfiles, ["anchor", "coastal"]);
  assert.equal(body.active, false);
  assert.equal(body.mark, null);
  assert.equal(anchorReferences.at(-1), null);
  plugin.stop();
});

test("Display clears a persisted runtime anchor mark when Traffic leaves Anchored", () => {
  let profile = "coastal";
  const paths = {
    "navigation.position": { latitude: 56.45, longitude: -5.45 },
    "environment.depth.belowKeel": 4.2,
  };
  const { plugin } = harness(paths, {}, {}, {
    ajrmMarineTrafficApi: {
      status() { return { profiles: { current: profile } }; },
      setProfile(value) { profile = value; return { current: value }; },
    },
  });
  plugin.start({});
  const { router, routes } = routeHarness();
  plugin.signalKApiRoutes(router);
  const response = { json(value) { this.body = value; }, status() { return this; } };

  routes.get("POST /ajrmMarineDisplay/anchor/drop")({}, response);
  profile = "offshore";
  routes.get("GET /ajrmMarineDisplay/anchor")({}, response);
  assert.equal(response.body.active, false);
  assert.equal(response.body.mark, null);
  plugin.stop();
});
