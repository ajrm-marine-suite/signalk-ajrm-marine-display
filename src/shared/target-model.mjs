import { applyTargetClassification } from "./target-classification.mjs";

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
		aisClass: "A",
		isAton: false,
		targetKind: "vessel",
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
	};
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

export function applySnapshotToTarget(target, vessel) {
	target.mmsi = String(vessel.mmsi);
	target.name = signalKText(vessel.name) || `<${vessel.mmsi}>`;
	target.callsign = signalKText(vessel.communication?.callsignVhf) || "---";
	target.imo = signalKText(vessel.registrations?.imo);
	target.sog = signalKNumber(vessel.navigation?.speedOverGround);
	target.cog = signalKNumber(vessel.navigation?.courseOverGroundTrue);
	target.hdg = vessel.navigation?.headingTrue?.value;
	target.rot = vessel.navigation?.rateOfTurn?.value;
	const position = signalKValue(vessel.navigation?.position);
	target.latitude = position?.latitude;
	target.longitude = position?.longitude;
	target.lastSeenDate = new Date(vessel.navigation?.position?.timestamp);
	const shipType = signalKType(vessel.design?.aisShipType);
	const atonType = signalKType(vessel.atonType);
	target.typeId = shipType.id ?? atonType.id;
	target.type = shipType.name ?? atonType.name ?? "---";
	target.isAton =
		atonType.id != null || atonType.name != null || signalKValue(vessel.atonType) != null;
	target.aisClass = signalKText(vessel.sensors?.ais?.class) || "A";
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
	applyTargetClassification(target);

	return target;
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
			target.aisClass = signalKText(value) ?? rawValue;
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
