"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  alertEvents,
  announcementEvents,
  displayTargets,
  panelEvents,
  uiState,
} = require("../plugin/lib/compatibility");

test("Traffic Core targets project into the Display webapp shape", () => {
  const targets = displayTargets({
    generatedAt: "2026-06-20T12:00:00.000Z",
    targets: [
      {
        id: "vessels.urn:mrn:imo:mmsi:235000001",
        mmsi: "235000001",
        name: "Ferry Alpha",
        position: { latitude: 56.2, longitude: -5.5 },
        navigation: { sog: 5, cogTrue: 1.2 },
        encounter: {
          state: "alarm",
          range: 1200,
          bearingTrue: Math.PI / 2,
          cpa: 40,
          tcpa: 180,
          silenced: true,
          uiOrder: 4,
        },
        freshness: {
          updatedAt: "2026-06-20T11:59:58.000Z",
          ageMs: 2000,
        },
      },
    ],
  });
  assert.equal(targets["235000001"].alarmState, "danger");
  assert.equal(targets["235000001"].alarmIsMuted, true);
  assert.equal(targets["235000001"].bearingFormatted, "90 T");
  assert.equal(targets["235000001"].cpaFormatted, "40 m");
  assert.equal(targets["235000001"].isValid, true);
});

test("Display target formatting can follow preferred distance units without changing raw values", () => {
  const targets = displayTargets(
    {
      targets: [
        {
          mmsi: "235000001",
          encounter: {
            state: "warn",
            range: 1667,
            cpa: 250,
            tcpa: 180,
            collisionCandidate: true,
          },
        },
      ],
    },
    { distanceUnit: "ft" },
  );
  assert.equal(targets["235000001"].range, 1667);
  assert.equal(targets["235000001"].cpa, 250);
  assert.equal(targets["235000001"].distanceUnit, "ft");
  assert.equal(targets["235000001"].rangeFormatted, "1.04 mi");
  assert.equal(targets["235000001"].cpaFormatted, "820 ft");
});

test("Notifications Plus remains the semantic owner of Display alerts", () => {
  const broker = {
    serverTime: "2026-06-20T12:00:00.000Z",
    active: [
      {
        eventId: "event-1",
        timestamp: "2026-06-20T11:59:59.000Z",
        priority: { level: "alarm", score: 80 },
        delivery: { visual: true, audio: true },
        presentation: {
          title: "Ferry Alpha",
          label: "Collision alarm",
          message: "Collision alarm from Ferry Alpha.",
          category: "cpa",
        },
        context: { mmsi: "235000001" },
      },
    ],
  };
  const events = alertEvents(broker);
  assert.equal(events[0].uiSeverity, "danger");
  assert.equal(events[0].mmsi, "235000001");
  assert.deepEqual(events[0].methods, ["visual", "sound"]);
  assert.equal(panelEvents(broker).entries[0].message, "Collision alarm from Ferry Alpha.");
});

test("announcement feed includes the immediate audio event before resolution", () => {
  const immediate = {
    eventId: "audio-now",
    timestamp: "2026-06-20T12:00:02.000Z",
    priority: { level: "danger" },
    presentation: {
      title: "Ferry Alpha",
      message: "Collision alarm from Ferry Alpha.",
      category: "cpa",
    },
    context: { mmsi: "235000001" },
  };
  const previous = {
    eventId: "audio-before",
    timestamp: "2026-06-20T12:00:01.000Z",
    presentation: { message: "Previous announcement." },
  };
  assert.deepEqual(
    announcementEvents({
      lastAudioEvent: immediate,
      recentActivity: [previous],
    }),
    [immediate, previous],
  );
});

test("announcement feed deduplicates an audio event after it enters history", () => {
  const event = {
    eventId: "audio-now",
    presentation: { message: "Traffic advisory." },
  };
  assert.deepEqual(
    announcementEvents({
      lastAudioEvent: event,
      recentActivity: [event, { eventId: "older" }],
    }),
    [event, { eventId: "older" }],
  );
});

test("UI state combines Traffic Core health, broker alerts and Audio status", () => {
  const result = uiState({
    engineProjection: {
      profile: "coastal",
      generatedAt: "2026-06-20T12:00:00.000Z",
      source: {
        ownVesselPositionFresh: true,
        ownVesselPositionAgeMs: 1000,
      },
    },
    brokerProjection: { active: [], recentActivity: [] },
    audioStatus: { muted: true, localPlayback: true },
    audioPolicy: {
      muted: false,
      automuteStationary: true,
      automuteStationarySpeed: 0.35,
      status: "Sound enabled because vessel is moving.",
    },
    autoProfile: {
      enabled: true,
      status: "Auto selected Coastal.",
      settings: { enabled: true, outsideProfile: "coastal" },
    },
    self: {
      mmsi: { value: "235008635" },
      navigation: {
        position: { value: { latitude: 56.2, longitude: -5.5 } },
      },
    },
  });
  assert.equal(result.currentProfile, "coastal");
  assert.equal(result.speechOutput.muted, true);
  assert.equal(result.dataHealth.healthy, true);
  assert.equal(result.speechOutput.automuteStationary, true);
  assert.equal(result.autoProfileStatus.enabled, true);
  assert.equal(result.autoProfileStatus.message, "Auto selected Coastal.");
});

test("UI state projects immediate audio delivery into the announcement log", () => {
  const result = uiState({
    engineProjection: {},
    brokerProjection: {
      lastAudioEvent: {
        eventId: "audio-now",
        timestamp: "2026-06-20T12:00:02.000Z",
        priority: { level: "warning" },
        presentation: {
          title: "Harbour Tug",
          message: "Traffic advisory.",
          category: "cpa",
        },
        context: { mmsi: "235900005" },
      },
      recentActivity: [],
    },
  });
  assert.deepEqual(result.announcementLog.entries, [
    {
      announcementId: "audio-now",
      ts: "2026-06-20T12:00:02.000Z",
      severity: "warning",
      category: "cpa",
      message: "Traffic advisory.",
      vesselName: "Harbour Tug",
      mmsi: "235900005",
    },
  ]);
});
