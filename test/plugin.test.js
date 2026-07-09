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
  return { plugin: createPlugin(app), messages, statuses, debugMessages };
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
  assert.equal(plugin.getOpenApi().info.version, packageInfo.version);
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
    { body: { footprints: false, labels: false, tilePane: false } },
    { json(value) { responses.push(value); } },
  );
  await routes.get("GET /ajrmMarineDisplay/debugControls")(
    {},
    { json(value) { responses.push(value); } },
  );

  assert.equal(responses[0].controls.footprints, true);
  assert.equal(responses[1].controls.footprints, false);
  assert.equal(responses[1].controls.labels, false);
  assert.equal(responses[1].controls.tilePane, false);
  assert.equal(responses[1].controls.markerUpdates, true);
  assert.equal(responses[2].controls.footprints, false);
  assert.match(debugMessages[0], /event=display\.debug\.controls/);
  assert.match(debugMessages[0], /footprints=false/);
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
