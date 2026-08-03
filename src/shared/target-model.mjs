import { applyTargetClassification } from "./target-classification.mjs";
import { countryForMmsi } from "./mmsi-mid-decoder.mjs";

const NAVIGATION_REFERENCE_CONTRACT = "ajrm-marine-navigation-reference";
const NAVIGATION_REFERENCE_SCHEMA_VERSION = 1;
const NAVIGATION_REFERENCE_MAX_AGE_MS = 15_000;

export function createTarget(mmsi) {
	return {
		mmsi: String(mmsi),
		name: undefined,
		callsign: undefined,
		imo: undefined,
		sog: undefined,
		cog: undefined,
		hdg: undefined,
		rot: undefined,
		magvar: undefined,
		latitude: undefined,
		longitude: undefined,
		lastSeenDate: undefined,
		typeId: undefined,
		type: "---",
		aisClass: null,
		aisClassEvidence: null,
		isAton: false,
		targetKind: "vessel",
		targetKindDetail: null,
		collisionCandidate: true,
		status: "---",
		length: undefined,
		beam: undefined,
		dimensionToBow: undefined,
		dimensionToStern: undefined,
		dimensionToPort: undefined,
		dimensionToStarboard: undefined,
		aisFromBow: undefined,
		aisFromCenter: undefined,
		draft: undefined,
		destination: "---",
		eta: "---",
		isVirtual: 0,
		isOffPosition: 0,
		navigationReference: null,
	};
}

export function vesselTargetId(vessel, fallbackId) {
	const rawId = signalKValue(vessel?.mmsi) ?? signalKValue(vessel?.uuid) ?? fallbackId;
	const text = String(rawId ?? "").trim();
	return text || "self";
}

export function signalKValue(value) {
	if (
		value &&
		typeof value === "object" &&
		Object.hasOwn(value, "value")
	) {
		return signalKValue(value.value);
	}
	return value;
}

export function signalKText(value) {
	const raw = signalKValue(value);
	if (typeof raw === "string") return raw;
	if (raw && typeof raw === "object") return signalKText(raw.name);
	return undefined;
}

function signalKNumber(value) {
	const raw = signalKValue(value);
	if (raw == null || raw === "") return undefined;
	const number = Number(raw);
	return Number.isFinite(number) ? number : undefined;
}

function signalKBoolean(value) {
	return Boolean(signalKValue(value));
}

function signalKType(value) {
	const raw = signalKValue(value);
	if (!raw || typeof raw !== "object") return {};
	return {
		id: signalKNumber(raw.id),
		name: signalKText(raw.name),
	};
}

function signalKLength(value) {
	const raw = signalKValue(value);
	if (raw && typeof raw === "object") return signalKNumber(raw.overall);
	return signalKNumber(raw);
}

function signalKDraft(value) {
	const raw = signalKValue(value);
	if (raw && typeof raw === "object") {
		return (
			signalKNumber(raw.current) ??
			signalKNumber(raw.maximum) ??
			signalKNumber(raw.minimum) ??
			signalKNumber(raw.canoe)
		);
	}
	return signalKNumber(raw);
}

function finiteDimension(value) {
	const number = signalKNumber(value);
	return number != null && number >= 0 ? number : undefined;
}

function applySensorAisReference(target) {
	const length = finiteDimension(target.length);
	const beam = finiteDimension(target.beam);
	const fromBow = finiteDimension(target.aisFromBow);
	const fromCenter = signalKNumber(target.aisFromCenter);

	if (length != null && fromBow != null && fromBow <= length) {
		target.dimensionToBow = fromBow;
		target.dimensionToStern = length - fromBow;
	}

	if (
		beam != null &&
		Number.isFinite(fromCenter) &&
		Math.abs(fromCenter) <= beam / 2
	) {
		target.dimensionToPort = beam / 2 + fromCenter;
		target.dimensionToStarboard = beam / 2 - fromCenter;
	}
}

export function applySnapshotToTarget(target, vessel, fallbackId) {
	const targetId = vesselTargetId(vessel, fallbackId);
	const mmsiCountry = countryForMmsi(targetId);
	target.mmsi = targetId;
	target.mmsiCountryCode = mmsiCountry?.code;
	target.mmsiCountryName = mmsiCountry?.name;
	target.name = signalKText(vessel.name) || `<${targetId}>`;
	target.callsign = signalKText(vessel.communication?.callsignVhf) || "---";
	target.imo = signalKText(vessel.registrations?.imo);
	target.sog = signalKNumber(vessel.navigation?.speedOverGround);
	target.cog = signalKNumber(vessel.navigation?.courseOverGroundTrue);
	target.hdg = vessel.navigation?.headingTrue?.value;
	target.rot = signalKNumber(vessel.navigation?.rateOfTurn);
	const position = signalKValue(vessel.navigation?.position);
	target.latitude = position?.latitude;
	target.longitude = position?.longitude;
	target.lastSeenDate = vessel.navigation?.position?.timestamp
		? new Date(vessel.navigation.position.timestamp)
		: new Date();
	const shipType = signalKType(vessel.design?.aisShipType);
	const atonType = signalKType(vessel.atonType);
	target.typeId = shipType.id ?? atonType.id;
	target.type = shipType.name ?? atonType.name ?? "---";
	target.isAton =
		atonType.id != null || atonType.name != null || signalKValue(vessel.atonType) != null;
	target.aisClass = normalizeAisClass(vessel.sensors?.ais?.class);
	target.aisFromBow = signalKNumber(vessel.sensors?.ais?.fromBow);
	target.aisFromCenter = signalKNumber(vessel.sensors?.ais?.fromCenter);
	target.status = signalKText(vessel.navigation?.state) ?? "---";
	target.length = signalKLength(vessel.design?.length);
	target.beam = signalKNumber(vessel.design?.beam);
	target.dimensionToBow = undefined;
	target.dimensionToStern = undefined;
	target.dimensionToPort = undefined;
	target.dimensionToStarboard = undefined;
	applySensorAisReference(target);
	target.draft = signalKDraft(vessel.design?.draft) ?? "---";
	target.destination =
		signalKText(vessel.navigation?.destination?.commonName) ?? "---";
	target.eta = signalKText(vessel.navigation?.destination?.eta) ?? "---";
	target.isVirtual = signalKBoolean(vessel.virtual) ? 1 : 0;
	target.isOffPosition = signalKBoolean(vessel.offPosition) ? 1 : 0;
	applyNavigationReferenceSnapshot(target, vessel);
	applyTargetClassification(target);

	return target;
}

export function applyNavigationReferenceSnapshot(target, vessel) {
	const container = vessel?.plugins?.ajrmMarineNavigationReference;
	const providerPresent = Boolean(
		container &&
			typeof container === "object" &&
			Object.hasOwn(container, "state"),
	);
	if (!providerPresent) {
		target.navigationReference = null;
		return false;
	}

	const state = signalKValue(container.state);
	const validContract =
		state &&
		typeof state === "object" &&
		state.contract === NAVIGATION_REFERENCE_CONTRACT &&
		state.schemaVersion === NAVIGATION_REFERENCE_SCHEMA_VERSION;
	if (!validContract) {
		clearProviderOwnMotion(target);
		target.navigationReference = {
			present: true,
			valid: false,
			reason: "provider-contract-invalid",
		};
		return true;
	}

	const updatedAtMs = Date.parse(state.updatedAt);
	if (
		!Number.isFinite(updatedAtMs) ||
		Math.abs(Date.now() - updatedAtMs) > NAVIGATION_REFERENCE_MAX_AGE_MS
	) {
		clearProviderOwnMotion(target);
		target.navigationReference = {
			present: true,
			valid: false,
			reason: Number.isFinite(updatedAtMs)
				? "provider-state-stale"
				: "provider-updated-at-invalid",
		};
		return true;
	}

	const position = navigationReferencePosition(state.position);
	const groundTrack = navigationReferenceGroundTrack(state.groundTrack);
	const heading = navigationReferenceMeasurement(state.bowHeadingTrue);
	target.latitude = position?.value.latitude;
	target.longitude = position?.value.longitude;
	target.lastSeenDate = validDate(position?.timestamp);
	target.cog = groundTrack?.courseTrue.value;
	target.sog = groundTrack?.speedOverGround.value;
	target.hdg = heading?.value;
	target.navigationReference = {
		present: true,
		valid: true,
		contract: state.contract,
		schemaVersion: state.schemaVersion,
		updatedAt: state.updatedAt,
		status: signalKText(state.status) || null,
		position,
		groundTrack,
		bowHeadingTrue: heading,
		clockReference: navigationReferenceMeasurement(state.clockReference, {
			includeKind: true,
		}),
	};
	return true;
}

export function applyDeltaValue(target, { path, value, timestamp }) {
	const rawValue = signalKValue(value);

	switch (path) {
		case "":
			if (rawValue?.name) {
				target.name = signalKText(rawValue.name);
			}
			if (rawValue?.communication?.callsignVhf) {
				target.callsign = signalKText(rawValue.communication.callsignVhf);
			}
			if (rawValue?.registrations?.imo) {
				target.imo = signalKText(rawValue.registrations.imo)
					?.replace(/imo/i, "")
					.trim();
			}
			break;
		case "name":
			target.name = signalKText(value);
			break;
		case "communication.callsignVhf":
			target.callsign = signalKText(value);
			break;
		case "registrations.imo":
			target.imo = signalKText(value)?.replace(/imo/i, "").trim();
			break;
		case "navigation.position":
			target.latitude = rawValue.latitude;
			target.longitude = rawValue.longitude;
			target.lastSeenDate = new Date(timestamp);
			break;
		case "navigation.courseOverGroundTrue":
			target.cog = signalKNumber(value);
			break;
		case "navigation.speedOverGround":
			target.sog = signalKNumber(value);
			break;
		case "navigation.magneticVariation":
			target.magvar = signalKNumber(value);
			break;
		case "navigation.headingTrue":
			target.hdg = signalKNumber(value);
			break;
		case "navigation.rateOfTurn":
			target.rot = signalKNumber(value);
			break;
		case "design.aisShipType":
			{
				const shipType = signalKType(value);
				target.typeId = shipType.id;
				target.type = shipType.name;
			}
			target.isAton = false;
			break;
		case "navigation.state":
			target.status = signalKText(value) ?? rawValue;
			break;
		case "sensors.ais.class":
			target.aisClass = normalizeAisClass(value);
			break;
		case "sensors.ais.fromBow":
			target.aisFromBow = signalKNumber(value);
			applySensorAisReference(target);
			break;
		case "sensors.ais.fromCenter":
			target.aisFromCenter = signalKNumber(value);
			applySensorAisReference(target);
			break;
		case "navigation.destination.commonName":
			target.destination = signalKText(value) ?? "---";
			break;
		case "navigation.destination.eta":
			target.eta = signalKText(value) ?? "---";
			break;
		case "design.length":
			target.length = signalKLength(value);
			applySensorAisReference(target);
			break;
		case "design.beam":
			target.beam = signalKNumber(value);
			applySensorAisReference(target);
			break;
		case "design.draft":
			target.draft = signalKDraft(value);
			break;
		case "atonType":
			{
				const atonType = signalKType(value);
				target.typeId = atonType.id;
				target.type = atonType.name;
			}
			target.isAton = true;
			target.status ??= "default";
			break;
		case "offPosition":
			target.isOffPosition = signalKBoolean(value) ? 1 : 0;
			break;
		case "virtual":
			target.isVirtual = signalKBoolean(value) ? 1 : 0;
			break;
		default:
	}

	applyTargetClassification(target);
	return target;
}

export function normalizeAisClass(value) {
	const text = signalKText(value)?.trim().toUpperCase();
	return text === "A" || text === "B" ? text : null;
}

function clearProviderOwnMotion(target) {
	target.latitude = undefined;
	target.longitude = undefined;
	target.lastSeenDate = undefined;
	target.cog = undefined;
	target.sog = undefined;
	target.hdg = undefined;
}

function navigationReferencePosition(input) {
	const value = signalKValue(input?.value);
	const latitude = finiteNumber(value?.latitude);
	const longitude = finiteNumber(value?.longitude);
	const measurement = navigationReferenceEvidence(input);
	if (
		latitude === undefined ||
		longitude === undefined ||
		Math.abs(latitude) > 90 ||
		Math.abs(longitude) > 180 ||
		!measurement
	) {
		return null;
	}
	return {
		...measurement,
		value: { latitude, longitude },
	};
}

function navigationReferenceGroundTrack(input) {
	if (!input || typeof input !== "object" || input.coherent !== true) return null;
	const courseTrue = navigationReferenceMeasurement(input.courseTrue);
	const speedOverGround = navigationReferenceMeasurement(input.speedOverGround);
	if (!courseTrue || !speedOverGround) return null;
	if (
		!courseTrue.source ||
		courseTrue.source !== speedOverGround.source ||
		input.source !== courseTrue.source
	) {
		return null;
	}
	return {
		source: courseTrue.source,
		timestamp: validTimestamp(input.timestamp) ? input.timestamp : null,
		ageMs: finiteNonNegative(input.ageMs),
		gpsDependent:
			typeof input.gpsDependent === "boolean" ? input.gpsDependent : null,
		coherent: true,
		quality:
			input.quality && typeof input.quality === "object"
				? { ...input.quality }
				: null,
		courseTrue,
		speedOverGround,
	};
}

function navigationReferenceMeasurement(input, { includeKind = false } = {}) {
	const value = finiteNumber(input?.value);
	const evidence = navigationReferenceEvidence(input);
	if (value === undefined || !evidence) return null;
	return {
		...evidence,
		value,
		...(includeKind && typeof input.kind === "string"
			? { kind: input.kind }
			: {}),
	};
}

function navigationReferenceEvidence(input) {
	if (!input || typeof input !== "object") return null;
	const timestamp = validTimestamp(input.timestamp) ? input.timestamp : null;
	const source = signalKText(input.source);
	const method = signalKText(input.method);
	if (!timestamp || !source || !method) return null;
	return {
		source,
		sourceKind: signalKText(input.sourceKind) || null,
		timestamp,
		ageMs: finiteNonNegative(input.ageMs),
		method,
		uncertaintyRad: finiteNonNegative(input.uncertaintyRad),
		gpsDependent:
			typeof input.gpsDependent === "boolean" ? input.gpsDependent : null,
		originalTimestamp: validTimestamp(input.originalTimestamp)
			? input.originalTimestamp
			: null,
	};
}

function finiteNumber(value) {
	if (value === null || value === undefined || value === "") return undefined;
	const number = Number(value);
	return Number.isFinite(number) ? number : undefined;
}

function finiteNonNegative(value) {
	const number = finiteNumber(value);
	return number !== undefined && number >= 0 ? number : null;
}

function validTimestamp(value) {
	return Number.isFinite(Date.parse(value));
}

function validDate(value) {
	return validTimestamp(value) ? new Date(value) : undefined;
}
