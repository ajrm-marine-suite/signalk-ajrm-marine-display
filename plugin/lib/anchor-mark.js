/**
 * Validates and persists the chart annotation recorded when the skipper drops anchor.
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ANCHOR_MARK_FILE = "ajrm-marine-display-anchor-mark.json";

function normalizeAnchorMark(value) {
  const latitude = Number(value?.position?.latitude);
  const longitude = Number(value?.position?.longitude);
  const depthBelowKeelMeters = Number(value?.depthBelowKeelMeters);
  const droppedAt = String(value?.droppedAt || "").trim();
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    !Number.isFinite(depthBelowKeelMeters) ||
    !Number.isFinite(Date.parse(droppedAt))
  ) {
    return null;
  }
  return {
    position: { latitude, longitude },
    depthBelowKeelMeters,
    droppedAt,
  };
}

function anchorMarkFile(app) {
  if (typeof app?.getDataDirPath !== "function") return null;
  return path.join(app.getDataDirPath(), ANCHOR_MARK_FILE);
}

function loadAnchorMark(app) {
  const file = anchorMarkFile(app);
  if (!file || !fs.existsSync(file)) return null;
  try {
    return normalizeAnchorMark(JSON.parse(fs.readFileSync(file, "utf8")));
  } catch (error) {
    app.error?.(`[signalk-ajrm-marine-display] unable to load anchor mark: ${error.message}`);
    return null;
  }
}

function saveAnchorMark(app, value) {
  const mark = normalizeAnchorMark(value);
  if (!mark) throw new Error("Anchor mark is invalid.");
  const file = anchorMarkFile(app);
  if (file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(mark, null, 2)}\n`);
    fs.renameSync(temporary, file);
  }
  return mark;
}

function removeAnchorMark(app) {
  const file = anchorMarkFile(app);
  if (!file) return;
  try {
    fs.unlinkSync(file);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

module.exports = {
  ANCHOR_MARK_FILE,
  loadAnchorMark,
  normalizeAnchorMark,
  removeAnchorMark,
  saveAnchorMark,
};
