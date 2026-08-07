"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  alertEvents,
  announcementEvents,
  browserSpeechEvents,
  displayTargets,
  panelEvents,
  uiState,
} = require("../plugin/lib/compatibility");

test("AJRM Marine Traffic targets project into the Display webapp shape", () => {
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

test("Display projects explicit AIS class evidence and explicit null rate of turn", () => {
  const targets = displayTargets({
    targets: [
      {
        mmsi: "235000002",
        aisClass: "B",
        aisClassEvidence: {
          messageType: 18,
          source: "YDEN.4",
        },
        position: { latitude: 56.2, longitude: -5.5 },
        navigation: {
          rateOfTurn: null,
        },
      },
    ],
  });

  assert.equal(targets["235000002"].aisClass, "B");
  assert.equal(targets["235000002"].aisClassFormatted, "B");
  assert.deepEqual(targets["235000002"].aisClassEvidence, {
    messageType: 18,
    source: "YDEN.4",
  });
  assert.equal(targets["235000002"].rot, null);
  assert.equal(targets["235000002"].rotFormatted, "---");
});

test("Display does not invent AIS class or ROT ownership for older Traffic projections", () => {
  const targets = displayTargets({
    targets: [
      {
        mmsi: "235000003",
        position: { latitude: 56.2, longitude: -5.5 },
        navigation: {},
      },
    ],
  });

  assert.equal(Object.hasOwn(targets["235000003"], "aisClass"), false);
  assert.equal(Object.hasOwn(targets["235000003"], "rot"), false);
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

test("AJRM Marine Notifications remains the semantic owner of Display alerts", () => {
  const broker = {
    serverTime: "2026-06-20T12:00:00.000Z",
    active: [
      {
        eventId: "event-1",
        timestamp: "2026-06-20T11:59:59.000Z",
        priority: { level: "alarm", score: 80 },
        delivery: { visual: true, audio: true, expiresSeconds: 90 },
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
  assert.equal(events[0].shouldAnnounce, true);
  assert.equal(events[0].audioExpiresAt, "2026-06-20T12:01:29.000Z");
  assert.equal(panelEvents(broker).entries[0].message, "Collision alarm from Ferry Alpha.");
});

test("browser speech requires explicit Notifications audio delivery", () => {
  const base = {
    eventId: "traffic:235000001:4",
    timestamp: "2026-06-20T12:00:02.000Z",
    priority: { level: "warning" },
    presentation: {
      message: "Traffic advisory from Ferry Alpha.",
    },
  };

  assert.deepEqual(browserSpeechEvents({ lastAudioEvent: base }), []);
  assert.deepEqual(
    browserSpeechEvents({
      lastAudioEvent: {
        ...base,
        delivery: { audio: true, expiresSeconds: 30 },
      },
    }),
    [{
      id: "traffic:235000001:4",
      message: "Traffic advisory from Ferry Alpha.",
      state: "warning",
      audioExpiresAt: "2026-06-20T12:00:32.000Z",
      ts: "2026-06-20T12:00:02.000Z",
    }],
  );
});

test("Active Alerts panel excludes resolved recent activity", () => {
  const result = panelEvents({
    active: [],
    recentActivity: [
      {
        eventId: "resolved-traffic",
        lifecycle: "resolved",
        priority: { level: "warning" },
        presentation: {
          message: "Traffic advisory from KERRY.",
          category: "cpa",
        },
      },
      {
        eventId: "resolved-instrument",
        lifecycle: "resolved",
        priority: { level: "information" },
        presentation: {
          message: "Engine room temperature rising.",
          category: "instrument-alert",
        },
      },
    ],
  });

  assert.deepEqual(result.entries, []);
  assert.deepEqual(result.summary, {
    count: 0,
    hasActiveAlerts: false,
    hasOnlyInfoMessages: true,
  });
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

test("UI state combines AJRM Marine Traffic health, broker alerts and Audio status", () => {
  const result = uiState({
    trafficProjection: {
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
    trafficProjection: {},
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
