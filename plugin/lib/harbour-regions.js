"use strict";

function normalizeRegionCollection(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((resource, index) => ({
      ...resource,
      id: resource?.id ?? resource?.identifier ?? String(index),
    }));
  }
  return Object.entries(value).map(([id, resource]) => ({
    ...(resource || {}),
    id: resource?.id ?? resource?.identifier ?? id,
  }));
}

function getRegionGeometry(region = {}) {
  const feature = region.feature;
  if (feature?.type === "Feature") return feature.geometry;
  if (feature?.type === "Polygon" || feature?.type === "MultiPolygon") {
    return feature;
  }
  if (
    region.geometry?.type === "Polygon" ||
    region.geometry?.type === "MultiPolygon"
  ) {
    return region.geometry;
  }
  return null;
}

function isHarbourRegion(region = {}, prefix = "Harbour:") {
  const name = String(region.name || "").trim().toLowerCase();
  const normalizedPrefix = String(prefix || "").trim().toLowerCase();
  return Boolean(normalizedPrefix && name.startsWith(normalizedPrefix));
}

async function loadHarbourRegions({
  resourcesApi,
  prefix = "Harbour:",
} = {}) {
  if (!resourcesApi?.listResources) {
    throw new Error("Signal K resourcesApi.listResources is not available");
  }
  const resources = await resourcesApi.listResources("regions", {});
  return normalizeRegionCollection(resources)
    .filter((region) => isHarbourRegion(region, prefix))
    .map((region) => ({
      id: region.id,
      name: region.name,
      geometry: getRegionGeometry(region),
    }))
    .filter((region) => region.geometry);
}

module.exports = {
  getRegionGeometry,
  isHarbourRegion,
  loadHarbourRegions,
  normalizeRegionCollection,
};
