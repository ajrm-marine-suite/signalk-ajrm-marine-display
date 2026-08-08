/**
 * Implements the routes responsibilities of the AJRM Marine Display Signal K server.
 */

"use strict";

const { randomUUID } = require("node:crypto");
const { XMLBuilder, XMLParser } = require("fast-xml-parser");

const EARTH_RADIUS_METERS = 6371008.8;

function parseGpxRoutes(xml, { fileName = null } = {}) {
  if (typeof xml !== "string" || !xml.trim()) {
    throw new Error("The GPX file is empty");
  }
  let document;
  try {
    document = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseTagValue: false,
      trimValues: true,
    }).parse(xml);
  } catch (error) {
    throw new Error(`Invalid GPX XML: ${error.message}`);
  }
  const gpx = document?.gpx;
  if (!gpx || String(gpx?.["@_version"] || "") !== "1.1") {
    throw new Error("A GPX 1.1 file is required");
  }
  const routes = asArray(gpx.rte).map((source, index) =>
    gpxRouteToSignalK(source, {
      fileName,
      index,
      metadataName: textValue(gpx?.metadata?.name),
      creator: textValue(gpx?.["@_creator"]),
    }),
  );
  if (!routes.length) throw new Error("The GPX file contains no routes");
  return routes;
}

function gpxRouteToSignalK(
  source,
  { fileName = null, index = 0, metadataName = "", creator = "" } = {},
) {
  const points = asArray(source?.rtept);
  if (points.length < 2) {
    throw new Error(`Route ${index + 1} contains fewer than two route points`);
  }
  const coordinates = points.map((point, pointIndex) => {
    const longitude = finiteCoordinate(point?.["@_lon"], -180, 180);
    const latitude = finiteCoordinate(point?.["@_lat"], -90, 90);
    if (longitude === null || latitude === null) {
      throw new Error(`Route ${index + 1}, point ${pointIndex + 1} has invalid coordinates`);
    }
    return [longitude, latitude];
  });
  const coordinatesMeta = points.map((point, pointIndex) => {
    const extensions = point?.extensions || {};
    const openCpn = compactObject({
      guid: textValue(extensions["opencpn:guid"]),
      arrivalRadiusNm: finiteNumber(extensions["opencpn:arrival_radius"]),
      rangeRings: finiteNumber(extensions["opencpn:waypoint_range_rings"]),
      scaleMin: finiteNumber(extensions["opencpn:scale_min_max"]?.["@_UseScale"]),
    });
    return compactObject({
      name: textValue(point?.name) || `WP${pointIndex + 1}`,
      description: textValue(point?.desc) || textValue(point?.cmt),
      ajrm: Object.keys(openCpn).length ? { openCpn } : undefined,
    });
  });
  const routeExtensions = source?.extensions || {};
  const style = routeExtensions["opencpn:style"] || {};
  const openCpn = compactObject({
    guid: textValue(routeExtensions["opencpn:guid"]),
    visible: textValue(routeExtensions["opencpn:viz"]),
    start: textValue(routeExtensions["opencpn:start"]),
    end: textValue(routeExtensions["opencpn:end"]),
    plannedDeparture: textValue(routeExtensions["opencpn:planned_departure"]),
    timeDisplay: textValue(routeExtensions["opencpn:time_display"]),
    style: compactObject({
      width: finiteNumber(style?.["@_width"]),
      style: finiteNumber(style?.["@_style"]),
    }),
  });
  return normalizeRouteResource({
    name:
      textValue(source?.name) ||
      (index === 0 ? metadataName : "") ||
      fileStem(fileName) ||
      `Route ${index + 1}`,
    description: textValue(source?.desc) || textValue(source?.cmt) || "",
    distance: routeDistanceMeters(coordinates),
    feature: {
      type: "Feature",
      geometry: { type: "LineString", coordinates },
      properties: {
        coordinatesMeta,
        ajrm: {
          importedFrom: "gpx",
          sourceFileName: fileName || null,
          sourceCreator: creator || null,
          openCpn,
        },
      },
    },
  });
}

function normalizeRouteResource(value) {
  const coordinates = value?.feature?.geometry?.coordinates;
  if (value?.feature?.geometry?.type !== "LineString" || !Array.isArray(coordinates)) {
    throw new Error("Signal K route geometry must be a GeoJSON LineString");
  }
  if (coordinates.length < 2) throw new Error("A route requires at least two points");
  const normalizedCoordinates = coordinates.map((coordinate, index) => {
    if (!Array.isArray(coordinate)) throw new Error(`Route point ${index + 1} is invalid`);
    const longitude = finiteCoordinate(coordinate[0], -180, 180);
    const latitude = finiteCoordinate(coordinate[1], -90, 90);
    if (longitude === null || latitude === null) {
      throw new Error(`Route point ${index + 1} has invalid coordinates`);
    }
    return [longitude, latitude];
  });
  const sourceProperties = value?.feature?.properties;
  const properties = sourceProperties && typeof sourceProperties === "object"
    ? structuredClone(sourceProperties)
    : {};
  if (Array.isArray(properties.coordinatesMeta)) {
    properties.coordinatesMeta = normalizedCoordinates.map((_, index) => {
      const meta = properties.coordinatesMeta[index];
      return meta && typeof meta === "object"
        ? structuredClone(meta)
        : { name: `WP${index + 1}` };
    });
  }
  return compactObject({
    name: cleanText(value?.name, 200) || "Unnamed route",
    description: cleanText(value?.description, 1000),
    distance: Number.isFinite(Number(value?.distance)) && Number(value.distance) >= 0
      ? Number(value.distance)
      : routeDistanceMeters(normalizedCoordinates),
    feature: {
      type: "Feature",
      geometry: { type: "LineString", coordinates: normalizedCoordinates },
      properties,
    },
  });
}

function reverseRouteResource(value) {
  const route = normalizeRouteResource(value);
  route.feature.geometry.coordinates.reverse();
  if (Array.isArray(route.feature.properties?.coordinatesMeta)) {
    route.feature.properties.coordinatesMeta.reverse();
  }
  const openCpn = route.feature.properties?.ajrm?.openCpn;
  if (openCpn && typeof openCpn === "object") {
    [openCpn.start, openCpn.end] = [openCpn.end, openCpn.start];
  }
  return route;
}

function routeToGpx(value, { routeGuid = randomUUID(), creator = "AJRM Marine Display" } = {}) {
  const route = normalizeRouteResource(value);
  const properties = route.feature.properties || {};
  const routeOpenCpn = properties.ajrm?.openCpn || {};
  const meta = Array.isArray(properties.coordinatesMeta) ? properties.coordinatesMeta : [];
  const rtept = route.feature.geometry.coordinates.map(([lon, lat], index) => {
    const pointMeta = meta[index] || {};
    const pointOpenCpn = pointMeta.ajrm?.openCpn || {};
    const extensions = {
      "opencpn:guid": pointOpenCpn.guid || randomUUID(),
    };
    if (Number.isFinite(Number(pointOpenCpn.arrivalRadiusNm))) {
      extensions["opencpn:arrival_radius"] = Number(pointOpenCpn.arrivalRadiusNm).toFixed(3);
    }
    if (Number.isFinite(Number(pointOpenCpn.rangeRings))) {
      extensions["opencpn:waypoint_range_rings"] = String(Number(pointOpenCpn.rangeRings));
    }
    return compactObject({
      "@_lat": latitudeText(lat),
      "@_lon": longitudeText(lon),
      name: cleanText(pointMeta.name, 200) || `WP${index + 1}`,
      desc: cleanText(pointMeta.description, 1000),
      extensions,
    });
  });
  const routeExtensions = compactObject({
    "opencpn:guid": routeOpenCpn.guid || routeGuid,
    "opencpn:viz": routeOpenCpn.visible || "1",
    "opencpn:start": routeOpenCpn.start || meta[0]?.name,
    "opencpn:end": routeOpenCpn.end || meta.at(-1)?.name,
    "opencpn:planned_departure": routeOpenCpn.plannedDeparture,
    "opencpn:time_display": routeOpenCpn.timeDisplay,
    "opencpn:style": {
      "@_width": String(Number(routeOpenCpn.style?.width) || 4),
      "@_style": String(Number(routeOpenCpn.style?.style) || 0),
    },
  });
  const object = {
    "?xml": { "@_version": "1.0", "@_encoding": "UTF-8" },
    gpx: {
      "@_version": "1.1",
      "@_creator": creator,
      "@_xmlns": "http://www.topografix.com/GPX/1/1",
      "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "@_xmlns:opencpn": "http://www.opencpn.org",
      "@_xmlns:gpxx": "http://www.garmin.com/xmlschemas/GpxExtensions/v3",
      "@_xsi:schemaLocation": "http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd",
      rte: compactObject({
        name: route.name,
        desc: route.description,
        extensions: routeExtensions,
        rtept,
      }),
    },
  };
  return new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
    suppressEmptyNode: true,
  }).build(object);
}

function routeDistanceMeters(coordinates) {
  let total = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    total += haversineMeters(coordinates[index - 1], coordinates[index]);
  }
  return Math.round(total * 100) / 100;
}

function haversineMeters([lon1, lat1], [lon2, lat2]) {
  const toRadians = Math.PI / 180;
  const phi1 = lat1 * toRadians;
  const phi2 = lat2 * toRadians;
  const deltaPhi = (lat2 - lat1) * toRadians;
  const deltaLambda = (lon2 - lon1) * toRadians;
  const a = Math.sin(deltaPhi / 2) ** 2
    + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function finiteCoordinate(value, minimum, maximum) {
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null;
}

function finiteNumber(value) {
  const number = Number(textValue(value));
  return Number.isFinite(number) ? number : undefined;
}

function textValue(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "object" && "#text" in value) return String(value["#text"]).trim();
  return String(value).trim();
}

function cleanText(value, maximum) {
  const text = textValue(value).normalize("NFC").replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return text ? text.slice(0, maximum) : undefined;
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function fileStem(value) {
  const name = String(value || "").split(/[\\/]/).pop() || "";
  return name.replace(/\.gpx$/i, "").trim();
}

function latitudeText(value) {
  return Number(value).toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

function longitudeText(value) {
  return latitudeText(value);
}

module.exports = {
  normalizeRouteResource,
  parseGpxRoutes,
  reverseRouteResource,
  routeDistanceMeters,
  routeToGpx,
};
