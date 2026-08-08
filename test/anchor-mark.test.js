"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  normalizeAnchorMark,
} = require("../plugin/lib/anchor-mark");

test("anchor mark requires explicit position, depth below keel and time", () => {
  assert.deepEqual(
    normalizeAnchorMark({
      position: { latitude: 56.45, longitude: -5.45 },
      depthBelowKeelMeters: 4.2,
      droppedAt: "2026-08-08T12:00:00.000Z",
    }),
    {
      position: { latitude: 56.45, longitude: -5.45 },
      depthBelowKeelMeters: 4.2,
      droppedAt: "2026-08-08T12:00:00.000Z",
    },
  );
  assert.equal(normalizeAnchorMark({ position: {}, depthBelowKeelMeters: 4.2 }), null);
  assert.equal(
    normalizeAnchorMark({
      position: { latitude: 56.45, longitude: -5.45 },
      droppedAt: "2026-08-08T12:00:00.000Z",
    }),
    null,
  );
});
