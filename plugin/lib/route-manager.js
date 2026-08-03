"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const {
  normalizeRouteResource,
  parseGpxRoutes,
  reverseRouteResource,
  routeToGpx,
} = require("./routes");

function createRouteManager({
  resourcesApi,
  routeDirectory,
  stateFile,
  onSelection = async () => {},
  now = () => new Date().toISOString(),
} = {}) {
  let active = null;

  async function init() {
    const saved = await readJson(stateFile);
    if (saved?.resource) {
      try {
        active = normalizeActive(saved);
      } catch {
        active = null;
      }
    }
    return current();
  }

  function current() {
    return active ? structuredClone(active) : null;
  }

  async function list() {
    const resources = resourcesApi?.listResources
      ? await resourcesApi.listResources("routes", {})
      : {};
    return Object.entries(resources || {}).map(([id, value]) => ({
      id,
      name: value?.name || "Unnamed route",
      description: value?.description || "",
      distance: Number.isFinite(Number(value?.distance)) ? Number(value.distance) : null,
      points: Array.isArray(value?.feature?.geometry?.coordinates)
        ? value.feature.geometry.coordinates.length
        : 0,
      timestamp: value?.timestamp || null,
      source: value?.$source || null,
    })).sort((left, right) => left.name.localeCompare(right.name));
  }

  async function listPiFiles() {
    const entries = await fs.promises
      .readdir(routeDirectory, { withFileTypes: true })
      .catch((error) => (error.code === "ENOENT" ? [] : Promise.reject(error)));
    const files = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".gpx")) continue;
      const info = await fs.promises.stat(path.join(routeDirectory, entry.name));
      files.push({
        fileName: entry.name,
        bytes: info.size,
        modifiedAt: new Date(info.mtimeMs).toISOString(),
      });
    }
    return files.sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt));
  }

  async function importGpx({ xml, fileName, routeIndex = 0, saveToPi = false } = {}) {
    const routes = parseGpxRoutes(xml, { fileName: safeGpxName(fileName, "route.gpx") });
    const index = boundedIndex(routeIndex, routes.length);
    const route = routes[index];
    const resourceId = randomUUID();
    await setResource(resourceId, route);
    const piFileName = saveToPi
      ? await writeGpxFile(route, fileName || `${route.name}.gpx`, resourceId)
      : null;
    return setActive({
      resourceId,
      resource: route,
      fileName: piFileName || safeGpxName(fileName, null),
      source: saveToPi ? "browser-import-saved-on-pi" : "browser-import",
      routeIndex: index,
      routeCount: routes.length,
      reversed: false,
    });
  }

  async function openPi({ fileName, routeIndex = 0 } = {}) {
    const safeName = safeExistingGpxName(fileName);
    const xml = await fs.promises.readFile(path.join(routeDirectory, safeName), "utf8");
    const routes = parseGpxRoutes(xml, { fileName: safeName });
    const index = boundedIndex(routeIndex, routes.length);
    const route = routes[index];
    const resourceId = randomUUID();
    await setResource(resourceId, route);
    return setActive({
      resourceId,
      resource: route,
      fileName: safeName,
      source: "pi-gpx",
      routeIndex: index,
      routeCount: routes.length,
      reversed: false,
    });
  }

  async function openResource({ id } = {}) {
    const resourceId = uuid(id);
    if (!resourcesApi?.getResource) throw new Error("Signal K Resources API is unavailable");
    const resource = normalizeRouteResource(await resourcesApi.getResource("routes", resourceId));
    return setActive({
      resourceId,
      resource,
      fileName: null,
      source: "signalk-resource",
      routeIndex: 0,
      routeCount: 1,
      reversed: false,
    });
  }

  async function reverse() {
    if (!active) throw new Error("Open a route before reversing it");
    active = {
      ...active,
      resource: reverseRouteResource(active.resource),
      reversed: !active.reversed,
      changedAt: now(),
      revision: active.revision + 1,
    };
    await persist();
    await onSelection(current());
    return current();
  }

  async function save({ saveAs = false, name, fileName } = {}) {
    if (!active) throw new Error("Open a route before saving it");
    const route = normalizeRouteResource({
      ...active.resource,
      name: cleanText(name, 200) || active.resource.name,
    });
    const resourceId = saveAs || !active.resourceId ? randomUUID() : active.resourceId;
    await setResource(resourceId, route);
    const piFileName = await writeGpxFile(
      route,
      fileName || active.fileName || `${route.name}.gpx`,
      saveAs ? randomUUID() : resourceId,
    );
    active = {
      ...active,
      resourceId,
      resource: route,
      fileName: piFileName,
      source: saveAs ? "saved-as" : "saved",
      changedAt: now(),
      revision: active.revision + 1,
    };
    await persist();
    await onSelection(current());
    return current();
  }

  async function close({ notify = true } = {}) {
    active = null;
    await persist();
    if (notify) await onSelection(null);
    return null;
  }

  async function restore(snapshot, { notify = false } = {}) {
    if (!snapshot?.resource) return close({ notify });
    const restored = normalizeActive({
      ...snapshot,
      openedAt: now(),
      changedAt: now(),
      source: "voyage-replay",
      revision: Number(snapshot.revision || 0) + 1,
    });
    if (restored.resourceId) await setResource(restored.resourceId, restored.resource);
    active = restored;
    await persist();
    if (notify) await onSelection(current());
    return current();
  }

  async function exportGpx() {
    if (!active) throw new Error("Open a route before exporting it");
    return {
      fileName: safeGpxName(active.fileName || `${active.resource.name}.gpx`, "route.gpx"),
      xml: routeToGpx(active.resource, { routeGuid: active.resourceId || randomUUID() }),
    };
  }

  async function setActive(value) {
    active = normalizeActive({
      ...value,
      openedAt: now(),
      changedAt: now(),
      revision: Number(active?.revision || 0) + 1,
    });
    await persist();
    await onSelection(current());
    return current();
  }

  async function setResource(id, route) {
    if (!resourcesApi?.setResource) throw new Error("Signal K Resources API is unavailable");
    await resourcesApi.setResource("routes", uuid(id), normalizeRouteResource(route));
  }

  async function writeGpxFile(route, requestedName, routeGuid) {
    const fileName = safeGpxName(requestedName, `${route.name || "route"}.gpx`);
    const destination = path.join(routeDirectory, fileName);
    const temporary = `${destination}.${randomUUID()}.tmp`;
    await fs.promises.mkdir(routeDirectory, { recursive: true });
    await fs.promises.writeFile(temporary, routeToGpx(route, { routeGuid }), "utf8");
    await fs.promises.rename(temporary, destination);
    return fileName;
  }

  async function persist() {
    await fs.promises.mkdir(path.dirname(stateFile), { recursive: true });
    const temporary = `${stateFile}.${randomUUID()}.tmp`;
    await fs.promises.writeFile(temporary, `${JSON.stringify(active, null, 2)}\n`, "utf8");
    await fs.promises.rename(temporary, stateFile);
  }

  return {
    close,
    current,
    exportGpx,
    importGpx,
    init,
    list,
    listPiFiles,
    openPi,
    openResource,
    restore,
    reverse,
    save,
  };
}

function normalizeActive(value) {
  return {
    contract: "ajrm-marine-display-active-route-v1",
    resourceId: value.resourceId ? uuid(value.resourceId) : null,
    resource: normalizeRouteResource(value.resource),
    fileName: value.fileName ? safeGpxName(value.fileName, null) : null,
    source: cleanText(value.source, 80) || "unknown",
    routeIndex: Number.isInteger(Number(value.routeIndex)) ? Number(value.routeIndex) : 0,
    routeCount: Math.max(1, Number(value.routeCount) || 1),
    reversed: value.reversed === true,
    openedAt: validTimestamp(value.openedAt) || new Date().toISOString(),
    changedAt: validTimestamp(value.changedAt) || validTimestamp(value.openedAt) || new Date().toISOString(),
    revision: Math.max(1, Math.floor(Number(value.revision) || 1)),
  };
}

function safeExistingGpxName(value) {
  const safe = safeGpxName(value, null);
  if (!safe || safe !== value) throw new Error("Invalid GPX file name");
  return safe;
}

function safeGpxName(value, fallback) {
  let name = String(value || fallback || "").split(/[\\/]/).pop().trim();
  name = name.normalize("NFC").replace(/[^\p{L}\p{N}._ -]+/gu, "-");
  if (!name) return null;
  if (!name.toLowerCase().endsWith(".gpx")) name += ".gpx";
  return name.slice(0, 240);
}

function boundedIndex(value, length) {
  const index = Number(value);
  if (!Number.isInteger(index) || index < 0 || index >= length) {
    throw new Error(`Select a route between 1 and ${length}`);
  }
  return index;
}

function uuid(value) {
  const text = String(value || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)) {
    throw new Error("A valid Signal K route UUID is required");
  }
  return text;
}

function cleanText(value, maximum) {
  const text = String(value || "").normalize("NFC").replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return text ? text.slice(0, maximum) : null;
}

function validTimestamp(value) {
  return Number.isFinite(Date.parse(value || "")) ? String(value) : null;
}

async function readJson(fileName) {
  try {
    return JSON.parse(await fs.promises.readFile(fileName, "utf8"));
  } catch {
    return null;
  }
}

module.exports = {
  createRouteManager,
  normalizeActive,
  safeGpxName,
};
