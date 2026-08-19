/**
 * Verifies Display's direct Location Editor profile-area contract.
 */

"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  loadLocationProfileAreas,
  locationService,
} = require("../plugin/lib/location-profile-areas");

test("profile areas are projected without Signal K region compatibility", async () => {
  const feature = {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [] },
  };
  const service = {
    contract: "ajrm-marine-locations-service-v1",
    async profileAreas() {
      return [{ id: "oban", name: "Oban", types: ["harbour"], feature }];
    },
  };
  assert.equal(locationService({ ajrmMarineLocations: service }), service);
  assert.deepEqual(await loadLocationProfileAreas({ ajrmMarineLocations: service }), [
    { id: "oban", name: "Oban", types: ["harbour"], feature },
  ]);
});

test("missing or old Location Editor services fail clearly", () => {
  assert.throws(() => locationService({}), /service is unavailable/);
  assert.throws(
    () => locationService({ ajrmMarineLocations: { contract: "ajrm-marine-locations-service-v1" } }),
    /does not expose profile areas/,
  );
});
