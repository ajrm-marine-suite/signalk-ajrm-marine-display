"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  getRegionGeometry,
  loadHarbourRegions,
  normalizeRegionCollection,
} = require("../plugin/lib/harbour-regions");

test("harbour resources are normalized, filtered, and projected for Display", async () => {
  const polygon = {
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
  const regions = await loadHarbourRegions({
    resourcesApi: {
      async listResources(type, query) {
        assert.equal(type, "regions");
        assert.deepEqual(query, {});
        return {
          oban: {
            name: "Harbour: Oban",
            feature: { type: "Feature", geometry: polygon },
            description: "not exposed",
          },
          cruising: {
            name: "Cruising area",
            geometry: polygon,
          },
          invalid: {
            name: "Harbour: Invalid",
            geometry: { type: "Point", coordinates: [-5.4, 56.4] },
          },
        };
      },
    },
  });
  assert.deepEqual(regions, [
    { id: "oban", name: "Harbour: Oban", geometry: polygon },
  ]);
});

test("harbour resource helpers accept arrays and direct polygon features", () => {
  assert.equal(normalizeRegionCollection([{ identifier: "one" }])[0].id, "one");
  const polygon = { type: "Polygon", coordinates: [] };
  assert.equal(getRegionGeometry({ feature: polygon }), polygon);
});
