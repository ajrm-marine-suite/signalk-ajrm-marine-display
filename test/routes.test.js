"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createRouteManager } = require("../plugin/lib/route-manager");
const {
  normalizeRouteResource,
  parseGpxRoutes,
  reverseRouteResource,
  routeToGpx,
} = require("../plugin/lib/routes");

const OPENCPN_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="OpenCPN" xmlns="http://www.topografix.com/GPX/1/1" xmlns:opencpn="http://www.opencpn.org">
  <rte>
    <name>Test passage</name>
    <desc>OpenCPN route</desc>
    <extensions>
      <opencpn:guid>route-guid</opencpn:guid>
      <opencpn:start>Start</opencpn:start>
      <opencpn:end>Finish</opencpn:end>
      <opencpn:style width="5" style="0" />
    </extensions>
    <rtept lat="56.1" lon="-5.1"><name>Start</name><extensions><opencpn:guid>point-a</opencpn:guid><opencpn:arrival_radius>0.050</opencpn:arrival_radius></extensions></rtept>
    <rtept lat="56.2" lon="-5.2"><name>Finish</name><desc>Destination</desc><extensions><opencpn:guid>point-b</opencpn:guid></extensions></rtept>
  </rte>
</gpx>`;

test("OpenCPN GPX imports as a Signal K v2 route and exports as GPX 1.1", () => {
  const [route] = parseGpxRoutes(OPENCPN_GPX, { fileName: "passage.gpx" });
  assert.equal(route.name, "Test passage");
  assert.equal(route.feature.type, "Feature");
  assert.deepEqual(route.feature.geometry.coordinates, [[-5.1, 56.1], [-5.2, 56.2]]);
  assert.equal(route.feature.properties.coordinatesMeta[0].name, "Start");
  assert.equal(route.feature.properties.coordinatesMeta[0].ajrm.openCpn.arrivalRadiusNm, 0.05);
  assert.equal(route.feature.properties.ajrm.openCpn.guid, "route-guid");
  assert.ok(route.distance > 0);

  const exported = routeToGpx(route, { routeGuid: "fallback-guid" });
  assert.match(exported, /version="1.1"/);
  assert.match(exported, /<opencpn:guid>route-guid<\/opencpn:guid>/);
  assert.match(exported, /lat="56.1" lon="-5.1"/);
  const [roundTrip] = parseGpxRoutes(exported, { fileName: "roundtrip.gpx" });
  assert.deepEqual(roundTrip.feature.geometry.coordinates, route.feature.geometry.coordinates);
  assert.deepEqual(
    roundTrip.feature.properties.coordinatesMeta.map((point) => point.name),
    ["Start", "Finish"],
  );
});

test("Savvy Navvy GPX routes use the metadata name and tolerate unnamed route points", () => {
  const xml = `<?xml version="1.0"?><gpx version="1.1" creator="savvy navvy" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>Route 2025-05-08T748</name></metadata><rte><rtept lat="55.15420878620311" lon="-7.514894851861261"/><rtept lat="55.62785673466423" lon="-6.188239937135821"/></rte></gpx>`;
  const [route] = parseGpxRoutes(xml, { fileName: "route_data_2025-05-08T748.gpx" });
  assert.equal(route.name, "Route 2025-05-08T748");
  assert.equal(route.feature.properties.ajrm.sourceCreator, "savvy navvy");
  assert.deepEqual(
    route.feature.properties.coordinatesMeta.map((point) => point.name),
    ["WP1", "WP2"],
  );
});

test("route reversal keeps point metadata aligned and swaps OpenCPN endpoints", () => {
  const [route] = parseGpxRoutes(OPENCPN_GPX);
  const reversed = reverseRouteResource(route);
  assert.deepEqual(reversed.feature.geometry.coordinates[0], [-5.2, 56.2]);
  assert.equal(reversed.feature.properties.coordinatesMeta[0].name, "Finish");
  assert.equal(reversed.feature.properties.ajrm.openCpn.start, "Finish");
  assert.equal(reversed.feature.properties.ajrm.openCpn.end, "Start");
});

test("Signal K route normalization rejects invalid geometry and strips third coordinate", () => {
  assert.throws(() => normalizeRouteResource({ feature: { geometry: { type: "Point" } } }));
  const route = normalizeRouteResource({
    feature: {
      geometry: { type: "LineString", coordinates: [[-5, 56, 12], [-5.1, 56.1, 9]] },
    },
  });
  assert.deepEqual(route.feature.geometry.coordinates, [[-5, 56], [-5.1, 56.1]]);
});

test("route manager saves GPX on the Pi and persists active route state", async () => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ajrm-routes-"));
  const resources = new Map();
  const selections = [];
  const resourcesApi = {
    async listResources() { return Object.fromEntries(resources); },
    async getResource(_type, id) { return resources.get(id); },
    async setResource(_type, id, value) { resources.set(id, structuredClone(value)); },
    async deleteResource(_type, id) { resources.delete(id); },
  };
  const manager = createRouteManager({
    resourcesApi,
    routeDirectory: path.join(root, "routes"),
    stateFile: path.join(root, "state", "active.json"),
    onSelection: async (selection) => selections.push(selection),
  });
  await manager.init();
  const transient = await manager.openExternal({
    resource: parseGpxRoutes(OPENCPN_GPX)[0],
    fileName: "Simulator route.gpx",
    source: "ajrm-marine-simulator",
  });
  assert.equal(transient.resourceId, null);
  assert.equal(transient.source, "ajrm-marine-simulator");
  assert.equal(resources.size, 0);

  const imported = await manager.importGpx({
    xml: OPENCPN_GPX,
    fileName: "Test passage.gpx",
    saveToPi: true,
  });
  assert.ok(resources.has(imported.resourceId));

  const reopened = await manager.importGpx({
    xml: OPENCPN_GPX,
    fileName: "Test passage.gpx",
  });
  assert.equal(reopened.resourceId, imported.resourceId);
  assert.equal(resources.size, 1);

  await assert.rejects(
    manager.save({ saveAs: true, name: "test PASSAGE" }),
    /unique route name/,
  );
  assert.equal((await manager.listPiFiles())[0].fileName, "Test passage.gpx");
  await manager.reverse();
  const saved = await manager.save({ saveAs: false });
  assert.equal(resources.get(saved.resourceId).feature.properties.coordinatesMeta[0].name, "Finish");
  assert.equal(selections.length, 5);

  const reloaded = createRouteManager({
    resourcesApi,
    routeDirectory: path.join(root, "routes"),
    stateFile: path.join(root, "state", "active.json"),
  });
  await reloaded.init();
  assert.equal(reloaded.current().resourceId, saved.resourceId);
  assert.equal(reloaded.current().reversed, true);

  const deleted = await reloaded.deleteResource({ id: saved.resourceId });
  assert.equal(deleted.deleted.name, "Test passage");
  assert.equal(deleted.active, null);
  assert.equal(resources.size, 0);

  const duplicateRoute = parseGpxRoutes(OPENCPN_GPX)[0];
  resources.set("11111111-1111-4111-8111-111111111111", duplicateRoute);
  resources.set("22222222-2222-4222-8222-222222222222", duplicateRoute);
  await assert.rejects(
    reloaded.importGpx({ xml: OPENCPN_GPX, fileName: "Test passage.gpx" }),
    /More than one Signal K route is named/,
  );
});
