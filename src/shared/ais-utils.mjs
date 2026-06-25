import { isFiniteCoord } from "./guards.mjs";
import { mmsiMidToCountry } from "./mmsi-mid-decoder.mjs";
import {
	applyTargetClassification,
	isCollisionCandidateTarget,
} from "./target-classification.mjs";
import { pointToFootprintDistanceMeters } from "./vessel-footprint.mjs";

const METERS_PER_NM = 1852;
const KNOTS_PER_M_PER_S = 1.94384;
const LOST_TARGET_WARNING_AGE = 10 * 60; // in seconds - 10 minutes

export function updateDerivedData({
	targets,
	selfTarget,
	maximumTargetRange,
	targetMaxAge,
	encounterOptions = {},
}) {
	// update self first
	if (!selfTarget) {
		console.warn(
			"No GPS position available (no data for our own vessel)",
			selfTarget,
		);
		throw new Error("No GPS position available (no data for our own vessel)");
		// FIXME: raise an alarm notification for this
		// FIXME: post a plugin error status for this
		//return;
	}

	updateSelfTarget(selfTarget);

	if (!selfTarget.isValid) {
		console.warn("No GPS position available (data is invalid)", selfTarget);
		throw new Error("No GPS position available (data is invalid)");
		// FIXME: raise an alarm notification for this
		// FIXME: post a plugin error status for this
		//return;
	}

	// then update all other targets
	targets.forEach((target, mmsi) => {
		if (mmsi !== selfTarget.mmsi) {
			updateTargetDerivedData({
				target,
				selfTarget,
				maximumTargetRange,
				targetMaxAge,
				encounterOptions,
			});
		}
	});
}

export function toRadians(v) {
	return (v * Math.PI) / 180;
}

export function toDegrees(v) {
	return (v * 180) / Math.PI;
}

function updateSelfTarget(selfTarget) {
	calculateXY(selfTarget, selfTarget);
	selfTarget.isValid = isFiniteCoord(selfTarget.latitude, selfTarget.longitude);
}

function updateTargetDerivedData({
	target,
	selfTarget,
	maximumTargetRange,
	targetMaxAge,
	encounterOptions = {},
}) {
	applyTargetClassification(target);
	var lastSeen = Math.max(
		0,
		Math.round((Date.now() - target.lastSeenDate) / 1000),
	);

	// console.log(target, lastSeen, targetMaxAge);

	target.lastSeen = lastSeen;
	target.isLost = lastSeen > LOST_TARGET_WARNING_AGE;

	if (
		!isFiniteCoord(target.latitude, target.longitude) ||
		target.lastSeen > targetMaxAge
	) {
		target.isValid = false;
	} else {
		target.isValid = true;
	}

	calculateRangeAndBearing(selfTarget, target);
	calculateXY(selfTarget, target);

	if (target.range / METERS_PER_NM < maximumTargetRange) {
		target.ignore = false;
	} else {
		// if the target is beyond max range, dont calculate cpa and stop processing it
		target.ignore = true;
		// console.log("ignore", target);
		return;
	}

	if (!isCollisionCandidateTarget(target)) {
		clearNonCollisionDerivedState(target);
		applyDisplayFields(target);
		return;
	}

	updateCpa(selfTarget, target, {
		useVesselShapeForCpa: encounterOptions.useVesselShapeForCpa !== false,
		vesselShapeOptions: encounterOptions,
	});
	clearTargetAlarmState(target, collisionCandidateDisplayOrder(target));

	applyDisplayFields(target);
}

function clearNonCollisionDerivedState(target) {
	target.cpa = null;
	target.tcpa = null;
	target.gpsCpa = undefined;
	target.cpaReference = undefined;
	target.vesselFootprint = null;
	target.spokenSummary = "";
	clearTargetAlarmState(target, nonCollisionTargetOrder(target));
}

function nonCollisionTargetOrder(target) {
	let order = 50000;
	if (target.range != null && target.range > 0) {
		order += Math.round((100 * target.range) / METERS_PER_NM);
	}
	if (target.range == null) {
		order += 99999;
	}
	return order;
}

function collisionCandidateDisplayOrder(target) {
	let order = target.tcpa != null && target.tcpa > 0 ? 30000 : 40000;

	if (target.tcpa != null && target.tcpa > 0) {
		order -= 1000;
		const weight = 1000;
		order -= Math.max(0, Math.round(weight - (weight * target.tcpa) / 3600));
	}

	if (target.cpa != null && target.cpa > 0) {
		const weight = 2000;
		order -= Math.max(
			0,
			Math.round(weight - (weight * target.cpa) / 5 / METERS_PER_NM),
		);
	}

	if (target.range != null && target.range > 0) {
		order += Math.round((100 * target.range) / METERS_PER_NM);
	}

	if (target.range == null) {
		order += 99999;
	}

	return order;
}

function clearTargetAlarmState(target, order = 40000) {
	target.guardAlarm = false;
	target.collisionAlarm = false;
	target.collisionWarning = false;
	target.sartAlarm = false;
	target.mobAlarm = false;
	target.epirbAlarm = false;
	target.alarmState = null;
	target.alarmType = null;
	target.alertLabel = "";
	target.spokenSummary = "";
	target.order = order;
}

function applyDisplayFields(target) {
	var mmsiMid = getMid(target.mmsi);
	target.mmsiCountryCode = mmsiMidToCountry.get(mmsiMid)?.code;
	target.mmsiCountryName = mmsiMidToCountry.get(mmsiMid)?.name;
	target.cpaFormatted = formatDistance(target.cpa, target.distanceUnit);
	target.tcpaFormatted = formatTcpa(target.tcpa);
	target.rangeFormatted =
		target.range != null
			? formatDistance(target.range, target.distanceUnit)
			: "---";
	target.bearingFormatted =
		target.bearing != null ? `${target.bearing} T` : "---";
	target.sogFormatted =
		target.sog != null
			? `${(target.sog * KNOTS_PER_M_PER_S).toFixed(1)} kn`
			: "---";
	target.cogFormatted =
		target.cog != null ? `${Math.round(toDegrees(target.cog))} T` : "---";
	target.hdgFormatted =
		target.hdg != null ? `${Math.round(toDegrees(target.hdg))} T` : "---";
	target.rotFormatted = Math.round(toDegrees(target.rot)) || "---";
	target.aisClassFormatted =
		target.aisClass + (target.isVirtual ? " (virtual)" : "");
	target.sizeFormatted = `${target.length?.toFixed(1) ?? "---"} m x ${target.beam?.toFixed(1) ?? "---"} m`;
	target.vesselFootprintSourceFormatted = vesselFootprintSourceLabel(target);
	target.imoFormatted = target.imo?.replace(/imo/i, "") || "---";
	target.latitudeFormatted = formatLat(target.latitude);
	target.longitudeFormatted = formatLon(target.longitude);
}

function vesselFootprintSourceLabel(target = {}) {
	const aisLabel = gpsAntennaOffsetLabel(target);
	if (target.vesselFootprint?.source === "ais") return aisLabel;
	if (target.vesselFootprint?.source === "assumed") {
		return "Site estimated";
	}
	if (
		finitePositive(target.dimensionToBow) &&
		finitePositive(target.dimensionToStern) &&
		finitePositive(target.dimensionToPort) &&
		finitePositive(target.dimensionToStarboard)
	) {
		return aisLabel;
	}
	if (
		finitePositive(target.length) &&
		finitePositive(target.beam) &&
		(Number.isFinite(Number(target.hdg)) || Number.isFinite(Number(target.cog)))
	) {
		return "Site estimated";
	}
	return "---";
}

function gpsAntennaOffsetLabel(target = {}) {
	const fromBow =
		finiteNumber(target.aisFromBow) ??
		finiteNumber(target.dimensionToBow) ??
		finiteNumber(target.vesselFootprint?.toBow);
	const beam =
		finiteNumber(target.beam) ?? finiteNumber(target.vesselFootprint?.beam);
	const toPort =
		finiteNumber(target.dimensionToPort) ??
		finiteNumber(target.vesselFootprint?.toPort);
	const fromCenter =
		finiteNumber(target.aisFromCenter) ??
		(beam != null && toPort != null ? toPort - beam / 2 : undefined);
	if (fromBow == null || !Number.isFinite(fromCenter)) return "---";
	return `${formatMeters(fromBow)} x ${formatMeters(fromCenter)}`;
}

function finiteNumber(value) {
	const number = Number(value);
	return Number.isFinite(number) ? number : undefined;
}

function formatMeters(value) {
	const rounded = Math.round(Number(value) * 10) / 10;
	return `${Object.is(rounded, -0) ? 0 : rounded} m`;
}

function finitePositive(value) {
	const number = Number(value);
	return Number.isFinite(number) && number > 0;
}

function calculateXY(selfTarget, target) {
	target.y = target.latitude * 111120;
	const latitudeScale = (Number(selfTarget.latitude) + Number(target.latitude)) / 2;
	target.x =
		target.longitude * 111120 * Math.cos(toRadians(latitudeScale));
	const sog = Number(target.sog);
	const cog = Number(target.cog);
	if (Number.isFinite(sog) && Number.isFinite(cog)) {
		target.vy = sog * Math.cos(cog); // cog is in radians
		target.vx = sog * Math.sin(cog); // cog is in radians
	} else {
		target.vy = undefined;
		target.vx = undefined;
	}
}

function calculateRangeAndBearing(selfTarget, target) {
	if (
		!selfTarget.isValid ||
		!isFiniteCoord(target.latitude, target.longitude)
	) {
		target.range = null;
		target.bearing = null;
		// console.log('cant calc range bearing', selfTarget, target);
		return;
	}

	target.range = Math.round(
		getDistanceFromLatLonInMeters(
			selfTarget.latitude,
			selfTarget.longitude,
			target.latitude,
			target.longitude,
		),
	);
	target.bearing = Math.round(
		getRhumbLineBearing(
			selfTarget.latitude,
			selfTarget.longitude,
			target.latitude,
			target.longitude,
		),
	);

	if (target.bearing >= 360) {
		target.bearing = 0;
	}
}

// from: http://geomalgorithms.com/a07-_distance.html
function updateCpa(selfTarget, target, options = {}) {
	if (
		!Number.isFinite(selfTarget.x) ||
		!Number.isFinite(selfTarget.y) ||
		!Number.isFinite(selfTarget.vx) ||
		!Number.isFinite(selfTarget.vy) ||
		!Number.isFinite(target.x) ||
		!Number.isFinite(target.y) ||
		!Number.isFinite(target.vx) ||
		!Number.isFinite(target.vy)
	) {
		//console.log('cant calc cpa: missing data', target.mmsi);
		target.cpa = null;
		target.tcpa = null;
		return;
	}

	// dv = Tr1.v - Tr2.v
	// this is relative speed
	// m/s
	var dv = {
		x: target.vx - selfTarget.vx,
		y: target.vy - selfTarget.vy,
	};

	// (m/s)^2
	var dv2 = dot(dv, dv);

	// guard against division by zero
	// the tracks are almost parallel
	// or there is almost no relative movement
	if (dv2 < 0.00000001) {
		// console.log('cant calc tcpa: ',target.mmsi);
		target.cpa = null;
		target.tcpa = null;
		return;
	}

	// w0 = Tr1.P0 - Tr2.P0
	// this is relative position
	// 111120 m / deg lat
	// m
	var w0 = {
		x: target.x - selfTarget.x,
		y: target.y - selfTarget.y,
	};

	// in secs
	// m * m/s / (m/s)^2 = m / (m/s) = s
	var tcpa = -dot(w0, dv) / dv2;

	// if tcpa is in the past,
	// or if tcpa is more than 3 hours in the future
	// then dont calc cpa & tcpa
	if (!tcpa || tcpa < 0 || tcpa > 3 * 3600) {
		//console.log('discarding tcpa: ', target.mmsi, tcpa);
		target.cpa = null;
		target.tcpa = null;
		return;
	}

	// Point P1 = Tr1.P0 + (ctime * Tr1.v);
	// m
	var p1 = {
		x: selfTarget.x + tcpa * selfTarget.vx,
		y: selfTarget.y + tcpa * selfTarget.vy,
	};

	// Point P2 = Tr2.P0 + (ctime * Tr2.v);
	// m
	var p2 = {
		x: target.x + tcpa * target.vx,
		y: target.y + tcpa * target.vy,
	};

	// in meters
	var gpsCpa = Math.round(dist(p1, p2));

	// in meters
	target.gpsCpa = gpsCpa;
	target.cpaReference = "gps";
	if (options.useVesselShapeForCpa === true) {
		const hullCpa = pointToFootprintDistanceMeters(
			p1,
			{ ...target, x: p2.x, y: p2.y },
			options.vesselShapeOptions,
		);
		if (Number.isFinite(hullCpa)) {
			target.cpa = Math.round(hullCpa);
			target.cpaReference = "hull";
		} else {
			target.cpa = gpsCpa;
		}
	} else {
		target.cpa = gpsCpa;
	}
	// in seconds
	target.tcpa = Math.round(tcpa);
}

// #define dot(u,v) ((u).x * (v).x + (u).y * (v).y + (u).z * (v).z)
function dot(u, v) {
	return u.x * v.x + u.y * v.y;
}

// #define norm(v) sqrt(dot(v,v))
// norm = length of vector
function norm(v) {
	return Math.sqrt(dot(v, v));
}

// #define d(u,v) norm(u-v)
// distance = norm of difference
function dist(u, v) {
	return norm({
		x: u.x - v.x,
		y: u.y - v.y,
	});
}

export function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
	var R = 6371000; // Radius of the earth in meters
	var dLat = toRadians(lat2 - lat1);
	var dLon = toRadians(lon2 - lon1);
	var a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRadians(lat1)) *
			Math.cos(toRadians(lat2)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c; // Distance in meters
	return d;
}

export function getRhumbLineBearing(lat1, lon1, lat2, lon2) {
	// difference of longitude coords
	var diffLon = toRadians(lon2 - lon1);

	// difference latitude coords phi
	var diffPhi = Math.log(
		Math.tan(toRadians(lat2) / 2 + Math.PI / 4) /
			Math.tan(toRadians(lat1) / 2 + Math.PI / 4),
	);

	// recalculate diffLon if it is greater than pi
	if (Math.abs(diffLon) > Math.PI) {
		if (diffLon > 0) {
			diffLon = (Math.PI * 2 - diffLon) * -1;
		} else {
			diffLon = Math.PI * 2 + diffLon;
		}
	}

	//return the angle, normalized
	return (toDegrees(Math.atan2(diffLon, diffPhi)) + 360) % 360;
}

// 012345678
// 8MIDXXXXX   Diver’s radio (not used in the U.S. in 2013)
// MIDXXXXXX   Ship
// 0MIDXXXXX   Group of ships; the U.S. Coast Guard, for example, is 03699999
// 00MIDXXXX   Coastal stations
// 111MIDXXX   SAR (Search and Rescue) aircraft
// 99MIDXXXX   Aids to Navigation
// 98MIDXXXX   Auxiliary craft associated with a parent ship
// 970MIDXXX   AIS SART (Search and Rescue Transmitter) (might be bad info - might be no MID)
// 972XXXXXX   MOB (Man Overboard) device (no MID)
// 974XXXXXX   EPIRB (Emergency Position Indicating Radio Beacon) AIS (no MID)
function getMid(mmsi) {
	if (mmsi.startsWith("111") || mmsi.startsWith("970")) {
		return mmsi.substring(3, 6);
	} else if (
		mmsi.startsWith("00") ||
		mmsi.startsWith("98") ||
		mmsi.startsWith("99")
	) {
		return mmsi.substring(2, 5);
	} else if (mmsi.startsWith("0") || mmsi.startsWith("8")) {
		return mmsi.substring(1, 4);
	} else {
		return mmsi.substring(0, 3);
	}
}

// N 39° 57.0689
function formatLat(dec) {
	var decAbs = Math.abs(dec);
	var deg = `0${Math.floor(decAbs)}`.slice(-2);
	var min = `0${((decAbs - deg) * 60).toFixed(4)}`.slice(-7);
	return `${dec > 0 ? "N" : "S"} ${deg}° ${min}`;
}

// W 075° 08.3692
function formatLon(dec) {
	var decAbs = Math.abs(dec);
	var deg = `00${Math.floor(decAbs)}`.slice(-3);
	var min = `0${((decAbs - deg) * 60).toFixed(4)}`.slice(-7);
	return `${dec > 0 ? "E" : "W"} ${deg}° ${min}`;
}

function formatDistance(value, unit = "nmi") {
	if (value == null) return "---";
	const meters = Number(value);
	if (!Number.isFinite(meters)) return "---";
	const absMeters = Math.abs(meters);
	const normalizedUnit = normalizeDistanceUnit(unit);
	if (normalizedUnit === "m" || normalizedUnit === "km") {
		return absMeters < 1000
			? `${Math.round(meters)} m`
			: `${(meters / 1000).toFixed(2)} km`;
	}
	if (normalizedUnit === "ft" || normalizedUnit === "mi") {
		const feet = meters / 0.3048;
		return Math.abs(feet) < 1000
			? `${Math.round(feet)} ft`
			: `${(meters / 1609.344).toFixed(2)} mi`;
	}
	return absMeters < 1000
		? `${Math.round(meters)} m`
		: `${(meters / METERS_PER_NM).toFixed(2)} NM`;
}

function normalizeDistanceUnit(unit) {
	const text = String(unit || "")
		.trim()
		.toLowerCase()
		.replace(/[\s_-]+/g, "");
	if (["m", "meter", "meters", "metre", "metres"].includes(text)) return "m";
	if (
		["km", "kilometer", "kilometers", "kilometre", "kilometres"].includes(
			text,
		)
	) {
		return "km";
	}
	if (["ft", "foot", "feet"].includes(text)) return "ft";
	if (["mi", "mile", "miles", "statutemile", "statutemiles"].includes(text)) {
		return "mi";
	}
	return "nmi";
}

// hh:mm:ss or mm:ss e.g. 01:15:23 or 51:37
function formatTcpa(tcpa) {
	if (tcpa == null || tcpa < 0) {
		return "---";
	}
	// when more than 60 mins, then format hh:mm:ss
	else if (Math.abs(tcpa) >= 3600) {
		return new Date(1000 * Math.abs(tcpa)).toISOString().substring(11, 19); // + ' hours'
	}
	// when less than 60 mins, then format mm:ss
	else {
		return new Date(1000 * Math.abs(tcpa)).toISOString().substring(14, 19); // + ' mins'
	}
}
