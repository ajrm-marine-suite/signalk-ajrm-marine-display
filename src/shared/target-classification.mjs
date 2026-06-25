export const AIS_TARGET_KIND_VESSEL = "vessel";
export const AIS_TARGET_KIND_BASE_STATION = "ais-base-station";
export const AIS_TARGET_KIND_AID_TO_NAVIGATION = "aid-to-navigation";
export const AIS_SPECIAL_SAFETY_TYPE_SAR_AIRCRAFT = "sar-aircraft";
export const AIS_SPECIAL_SAFETY_TYPE_SART = "sart";
export const AIS_SPECIAL_SAFETY_TYPE_MOB = "mob";
export const AIS_SPECIAL_SAFETY_TYPE_EPIRB = "epirb";

function normalizedText(value) {
	return String(value ?? "").trim().toLowerCase();
}

function compactText(value) {
	return normalizedText(value).replace(/[\s_-]+/g, "");
}

export function isAisBaseStationMmsi(mmsi) {
	return /^00\d{7}$/.test(String(mmsi || "").trim());
}

export function isAisBaseStationClass(aisClass) {
	const value = compactText(aisClass);
	return value === "base" || value === "basestation";
}

export function isAisBaseStationLabel(value) {
	const text = normalizedText(value);
	const compact = compactText(value);
	return (
		/\bais\s+base\b/.test(text) ||
		/\bbase\s+station\b/.test(text) ||
		compact.includes("aisbasestation")
	);
}

export function isAisBaseStationTarget(target = {}) {
	return (
		isAisBaseStationMmsi(target.mmsi) ||
		isAisBaseStationClass(target.aisClass) ||
		isAisBaseStationLabel(target.name) ||
		isAisBaseStationLabel(target.type)
	);
}

export function isAisAtonMmsi(mmsi) {
	return /^99\d{7}$/.test(String(mmsi || "").trim());
}

export function isAisAtonClass(aisClass) {
	const value = compactText(aisClass);
	return value === "aton" || value === "aidtonavigation" || value === "aidstonavigation";
}

export function isAisAtonTarget(target = {}) {
	return (
		target.isAton === true ||
		isAisAtonMmsi(target.mmsi) ||
		isAisAtonClass(target.aisClass)
	);
}

export function aisSpecialSafetyMmsiType(mmsi) {
	const value = String(mmsi || "").trim();
	if (value.startsWith("111")) return AIS_SPECIAL_SAFETY_TYPE_SAR_AIRCRAFT;
	if (value.startsWith("970")) return AIS_SPECIAL_SAFETY_TYPE_SART;
	if (value.startsWith("972")) return AIS_SPECIAL_SAFETY_TYPE_MOB;
	if (value.startsWith("974")) return AIS_SPECIAL_SAFETY_TYPE_EPIRB;
	return null;
}

export function isAisSpecialSafetyMmsi(mmsi) {
	return aisSpecialSafetyMmsiType(mmsi) != null;
}

export function aisEmergencyMmsiType(mmsi) {
	const type = aisSpecialSafetyMmsiType(mmsi);
	return type === AIS_SPECIAL_SAFETY_TYPE_SART ||
		type === AIS_SPECIAL_SAFETY_TYPE_MOB ||
		type === AIS_SPECIAL_SAFETY_TYPE_EPIRB
		? type
		: null;
}

export function isAisEmergencyMmsi(mmsi) {
	return aisEmergencyMmsiType(mmsi) != null;
}

export function classifyAisTarget(target = {}) {
	if (isAisBaseStationTarget(target)) {
		return {
			targetKind: AIS_TARGET_KIND_BASE_STATION,
			collisionCandidate: false,
		};
	}
	if (isAisAtonTarget(target)) {
		return {
			targetKind: AIS_TARGET_KIND_AID_TO_NAVIGATION,
			collisionCandidate: false,
		};
	}
	return {
		targetKind: AIS_TARGET_KIND_VESSEL,
		collisionCandidate: true,
	};
}

export function applyTargetClassification(target = {}) {
	const classification = classifyAisTarget(target);
	target.targetKind = classification.targetKind;
	target.collisionCandidate = classification.collisionCandidate;
	return target;
}

export function isCollisionCandidateTarget(target = {}) {
	return target.collisionCandidate !== false && classifyAisTarget(target).collisionCandidate;
}
