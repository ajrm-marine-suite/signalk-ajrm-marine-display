"use strict";

function valueOf(value) {
  return value && typeof value === "object" && "value" in value
    ? valueOf(value.value)
    : value;
}

function displayTargets(trafficProjection, options = {}) {
  const distanceUnit = normalizeDistanceUnit(options.distanceUnit);
  return Object.fromEntries(
    (Array.isArray(trafficProjection?.targets) ? trafficProjection.targets : []).map(
      (target) => {
        const mmsi = String(target?.mmsi || target?.id?.split(":").at(-1) || "");
        const state = String(target?.encounter?.state || "normal");
        const range = finite(target?.encounter?.range);
        const bearing = radiansToDegrees(target?.encounter?.bearingTrue);
        const cpa = finite(target?.encounter?.cpa);
        const tcpa = finite(target?.encounter?.tcpa);
        const sog = finite(target?.navigation?.sog);
        const cog = finite(target?.navigation?.cogTrue);
        const hdg = finite(target?.navigation?.headingTrue);
        const position = target?.position || {};
        return [
          mmsi,
          {
            mmsi,
            name: target?.name || mmsi,
            latitude: finite(position.latitude),
            longitude: finite(position.longitude),
            sog,
            cog,
            hdg,
            length: finite(target?.dimensions?.length),
            beam: finite(target?.dimensions?.beam),
            range,
            bearing,
            cpa,
            tcpa,
            alarmState: displayAlarmState(state),
            alarmIsMuted: target?.encounter?.silenced === true,
            collisionCandidate: target?.encounter?.collisionCandidate !== false,
            vesselSizeCategory: target?.encounter?.vesselSize || "small",
            order: finite(target?.encounter?.uiOrder) ?? Number.MAX_SAFE_INTEGER,
            isValid: validPosition(target?.position),
            lastSeenDate:
              target?.freshness?.updatedAt || trafficProjection?.generatedAt || null,
            lastSeen: Number.isFinite(Number(target?.freshness?.ageMs))
              ? Math.round(Number(target.freshness.ageMs) / 1000)
              : null,
            alertLabel: alertLabel(state),
            spokenSummary: "",
            distanceUnit,
            rangeFormatted: formatDistance(range, distanceUnit),
            bearingFormatted: bearing == null ? "---" : `${bearing} T`,
            cpaFormatted: formatDistance(cpa, distanceUnit),
            tcpaFormatted: formatTcpa(tcpa),
            sogFormatted: sog == null ? "---" : `${(sog * 1.94384).toFixed(1)} kn`,
            cogFormatted: angleFormatted(cog),
            hdgFormatted: angleFormatted(hdg),
            latitudeFormatted: coordinateFormatted(position.latitude, true),
            longitudeFormatted: coordinateFormatted(position.longitude, false),
            aisClassFormatted: "A",
            sizeFormatted: `${finite(target?.dimensions?.length)?.toFixed(1) || "---"} m x ${finite(target?.dimensions?.beam)?.toFixed(1) || "---"} m`,
            vesselFootprintSourceFormatted:
              target?.dimensions?.reference === "reported" ? "AIS reported" : "Site estimated",
            trafficState: state,
            trafficCorrelationId: target?.encounter?.correlationId || "",
          },
        ];
      },
    ),
  );
}

function alertEvents(brokerProjection) {
  return (Array.isArray(brokerProjection?.active) ? brokerProjection.active : [])
    .filter((entry) => entry?.delivery?.visual !== false)
    .map((entry, index) => {
      const state = String(entry?.priority?.level || entry?.state || "alert");
      return {
        id: String(entry?.eventId || entry?.subjectKey || `alert-${index}`),
        mmsi: String(entry?.context?.mmsi || ""),
        methods: deliveryMethods(entry),
        state,
        category: String(entry?.presentation?.category || "cpa"),
        message: String(entry?.presentation?.message || ""),
        displayName: String(entry?.presentation?.title || ""),
        uiLabel: String(entry?.presentation?.label || alertLabel(state)),
        uiSeverity: displaySeverity(state),
        uiRank: Number(entry?.priority?.score || 0),
        uiOrder: index,
        sizeCategory: String(entry?.context?.vesselSize || ""),
        ts: entry?.timestamp || brokerProjection?.serverTime || "",
        correlationId: entry?.correlationId || "",
      };
    });
}

function panelEvents(brokerProjection) {
  const active = alertEvents(brokerProjection).slice(0, 3);
  const recent = Array.isArray(brokerProjection?.recentActivity)
    ? brokerProjection.recentActivity
    : [];
  const entries = active.length
    ? active.map((event) => ({
        id: event.id,
        severity: event.uiSeverity,
        state: event.state,
        category: event.category,
        message: event.message,
        source: "active-alert",
        ts: event.ts,
        uiRank: event.uiRank,
        uiOrder: event.uiOrder,
      }))
    : recent.slice(0, 3).map((entry, index) => ({
        id: String(entry?.eventId || `recent-${index}`),
        severity: "info",
        state: String(entry?.priority?.level || "normal"),
        category: String(entry?.presentation?.category || "system"),
        message: String(entry?.presentation?.message || ""),
        source: "recent-message",
        ts: entry?.timestamp || "",
      }));
  return {
    serverTime: brokerProjection?.serverTime || new Date().toISOString(),
    entries,
    summary: {
      count: entries.length,
      hasActiveAlerts: active.length > 0,
      hasOnlyInfoMessages: entries.every((entry) => entry.severity === "info"),
    },
  };
}

function announcementEvents(brokerProjection) {
  const recent = Array.isArray(brokerProjection?.recentActivity)
    ? brokerProjection.recentActivity
    : [];
  const immediate = brokerProjection?.lastAudioEvent;
  if (!immediate || typeof immediate !== "object") return recent;
  const immediateId = String(immediate.eventId || "");
  return [
    immediate,
    ...recent.filter(
      (entry) => !immediateId || String(entry?.eventId || "") !== immediateId,
    ),
  ];
}

function uiState({
  trafficProjection,
  capabilities,
  brokerProjection,
  audioStatus,
  audioPolicy,
  autoProfile,
  self,
  refreshIntervalMs = 1000,
}) {
  const alerts = alertEvents(brokerProjection);
  const panels = panelEvents(brokerProjection);
  const serverTime =
    brokerProjection?.serverTime ||
    trafficProjection?.generatedAt ||
    new Date().toISOString();
  const ownPosition = valueOf(self?.navigation?.position);
  const source = trafficProjection?.source || {};
  const announcements = announcementEvents(brokerProjection);
  return {
    serverTime,
    currentProfile:
      trafficProjection?.profile || capabilities?.profile || "harbor",
    speechOutput: {
      currentProfile:
        trafficProjection?.profile || capabilities?.profile || "harbor",
      muted: audioPolicy?.muted === true || audioStatus?.muted === true,
      automuteStationary: audioPolicy?.automuteStationary === true,
      automuteStationarySpeed:
        audioPolicy?.automuteStationarySpeed ?? 0.35,
      piSpeech: audioStatus?.localPlayback !== false,
      audioStream: audioStatus?.liveStream !== false,
      muteStatus:
        audioPolicy?.status ||
        (audioStatus?.muted ? "Sounds muted." : "Sounds enabled."),
    },
    autoProfileStatus: {
      enabled: autoProfile?.enabled === true,
      currentProfile:
        trafficProjection?.profile || capabilities?.profile || "harbor",
      message:
        autoProfile?.status ||
        "AJRM Marine Traffic Auto Profile state is unavailable.",
      options: autoProfile?.settings || { enabled: false },
      insideRegionId: autoProfile?.insideRegionId || null,
      insideRegionName: autoProfile?.insideRegionName || null,
      nearestRegionId: autoProfile?.nearestRegionId || null,
      nearestRegionName: autoProfile?.nearestRegionName || null,
      distanceMeters: autoProfile?.distanceMeters ?? null,
      anchorHeld: autoProfile?.anchorHeld === true,
    },
    panelEvents: panels,
    alertEvents: { events: alerts },
    activeAlertSummary: {
      count: alerts.length,
      hasActiveAlerts: alerts.length > 0,
      highestState: alerts[0]?.state || "",
      visualCount: alerts.filter((event) => event.methods.includes("visual")).length,
      soundCount: alerts.filter((event) => event.methods.includes("sound")).length,
    },
    compactAlertFeed: {
      current: panels.entries[0]
        ? {
            active: panels.summary.hasActiveAlerts,
            headline: panels.entries[0].message,
          }
        : null,
    },
    browserSpeechEvents: { events: [], summary: { count: 0 } },
    announcementLog: {
      entries: announcements.map((entry) => ({
        announcementId: entry?.eventId,
        ts: entry?.timestamp,
        severity: entry?.priority?.level,
        category: entry?.presentation?.category,
        message: entry?.presentation?.message,
        vesselName: entry?.presentation?.title,
        mmsi: entry?.context?.mmsi,
      })),
      summary: {
        count: announcements.length,
        returned: announcements.length,
        truncated: false,
      },
    },
    dataHealth: {
      healthy:
        source.ownVesselPositionFresh !== false &&
        validPosition(ownPosition),
      state:
        source.ownVesselPositionFresh === false
          ? "stale"
          : validPosition(ownPosition)
            ? "ok"
            : "missing",
      message:
        source.ownVesselPositionFresh === false
          ? "No fresh GPS position available."
          : validPosition(ownPosition)
            ? ""
            : "No GPS position available.",
      selfMmsi: String(valueOf(self?.mmsi) || ""),
      hasSelfTarget: Boolean(self),
      hasPosition: validPosition(ownPosition),
      positionValid: validPosition(ownPosition),
      lastPositionAt: self?.navigation?.position?.timestamp || null,
      positionAgeSeconds: Number.isFinite(Number(source.ownVesselPositionAgeMs))
        ? Math.round(Number(source.ownVesselPositionAgeMs) / 1000)
        : null,
      maxPositionAgeSeconds:
        source.ownVesselPositionMaxAgeSeconds || 30,
      lostGpsActive: source.ownVesselPositionFresh === false,
      lostGpsPausedUntilRestored: false,
    },
    connectionHints: {
      serverReachable: true,
      generatedAt: serverTime,
      refreshIntervalSeconds: refreshIntervalMs / 1000,
      staleAfterSeconds: Math.max(15, Math.ceil((refreshIntervalMs / 1000) * 4)),
      staleMessage: "Signal K connection lost - showing last received data.",
    },
  };
}

function profiles(defaultProfiles, currentProfile, trafficProfiles = {}) {
  const result = structuredClone(defaultProfiles);
  for (const profile of ["anchor", "harbor", "coastal", "offshore"]) {
    result[profile] = {
      ...result[profile],
      cpaSensitivity:
        trafficProfiles?.[profile]?.cpaSensitivity ??
        result[profile].cpaSensitivity,
      tcpaLookahead:
        trafficProfiles?.[profile]?.tcpaLookahead ??
        result[profile].tcpaLookahead,
      repeatSensitivity:
        trafficProfiles?.[profile]?.repeatSensitivity ??
        result[profile].repeatSensitivity,
    };
  }
  result.current =
    currentProfile ||
    trafficProfiles?.current ||
    defaultProfiles.current ||
    "harbor";
  return result;
}

function displayAlarmState(state) {
  if (state === "alarm" || state === "emergency" || state === "danger") {
    return "danger";
  }
  if (
    state === "warn" ||
    state === "alert" ||
    state === "warning" ||
    state === "information"
  ) {
    return "warning";
  }
  return null;
}

function displaySeverity(state) {
  return displayAlarmState(state) || "info";
}

function alertLabel(state) {
  return {
    emergency: "Emergency",
    danger: "Collision alarm",
    alarm: "Collision alarm",
    warning: "Traffic advisory",
    warn: "Traffic advisory",
    information: "Alert",
    alert: "Alert",
  }[state] || "";
}

function deliveryMethods(entry) {
  const methods = [];
  if (entry?.delivery?.visual !== false) methods.push("visual");
  if (entry?.delivery?.audio === true) methods.push("sound");
  return methods;
}

function validPosition(position) {
  return (
    Number.isFinite(Number(position?.latitude)) &&
    Number.isFinite(Number(position?.longitude))
  );
}

function finite(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function radiansToDegrees(value) {
  const radians = finite(value);
  return radians == null ? null : Math.round(((radians * 180) / Math.PI + 360) % 360);
}

function angleFormatted(value) {
  const degrees = radiansToDegrees(value);
  return degrees == null ? "---" : `${degrees} T`;
}

function formatDistance(value, unit = "nmi") {
  const metres = finite(value);
  if (metres == null) return "---";
  const absMetres = Math.abs(metres);
  const normalizedUnit = normalizeDistanceUnit(unit);
  if (normalizedUnit === "m") {
    return absMetres < 1000
      ? `${Math.round(metres)} m`
      : `${(metres / 1000).toFixed(2)} km`;
  }
  if (normalizedUnit === "km") {
    return absMetres < 1000
      ? `${Math.round(metres)} m`
      : `${(metres / 1000).toFixed(2)} km`;
  }
  if (normalizedUnit === "ft") {
    const feet = metres / 0.3048;
    return Math.abs(feet) < 1000
      ? `${Math.round(feet)} ft`
      : `${(metres / 1609.344).toFixed(2)} mi`;
  }
  if (normalizedUnit === "mi") {
    const feet = metres / 0.3048;
    return Math.abs(feet) < 1000
      ? `${Math.round(feet)} ft`
      : `${(metres / 1609.344).toFixed(2)} mi`;
  }
  return absMetres < 1000
    ? `${Math.round(metres)} m`
    : `${(metres / 1852).toFixed(2)} NM`;
}

function normalizeDistanceUnit(unit) {
  const text = String(unit || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (["m", "meter", "meters", "metre", "metres"].includes(text)) return "m";
  if (["km", "kilometer", "kilometers", "kilometre", "kilometres"].includes(text)) {
    return "km";
  }
  if (["ft", "foot", "feet"].includes(text)) return "ft";
  if (["mi", "mile", "miles", "statutemile", "statutemiles"].includes(text)) {
    return "mi";
  }
  return "nmi";
}

function formatTcpa(value) {
  const seconds = finite(value);
  if (seconds == null || seconds < 0) return "---";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = Math.round(seconds % 60);
  return hours
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function coordinateFormatted(value, latitude) {
  const number = finite(value);
  if (number == null) return "---";
  const absolute = Math.abs(number);
  const degrees = Math.floor(absolute);
  const minutes = ((absolute - degrees) * 60).toFixed(4);
  const hemisphere = latitude
    ? number >= 0 ? "N" : "S"
    : number >= 0 ? "E" : "W";
  return `${hemisphere} ${degrees}° ${minutes}`;
}

module.exports = {
  alertEvents,
  announcementEvents,
  displayTargets,
  panelEvents,
  profiles,
  uiState,
  valueOf,
};
