/**
 * Loads automatic-profile areas from Location Editor's shared service for the
 * Display server. No Signal K region or name-prefix compatibility is used.
 */

"use strict";

const LOCATION_SERVICE_REGISTRY = Symbol.for("mcdonaldajr.ajrmMarineLocations");

function locationService(app) {
  const service = app?.ajrmMarineLocations || globalThis[LOCATION_SERVICE_REGISTRY];
  if (service?.contract !== "ajrm-marine-locations-service-v1") {
    throw new Error("AJRM Marine Location Editor profile-area service is unavailable.");
  }
  if (typeof service.profileAreas !== "function") {
    throw new Error("AJRM Marine Location Editor does not expose profile areas.");
  }
  return service;
}

async function loadLocationProfileAreas(app) {
  const locations = await locationService(app).profileAreas();
  return locations.map((location) => ({
    id: location.id,
    name: location.name,
    types: [...(location.types || [])],
    feature: structuredClone(location.feature),
  }));
}

module.exports = { loadLocationProfileAreas, locationService };
