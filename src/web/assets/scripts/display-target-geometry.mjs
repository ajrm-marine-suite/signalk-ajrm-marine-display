const EARTH_RADIUS_METRES = 6371000;

export function applyDisplayTargetGeometry({ targets, selfMmsi, now = Date.now() }) {
	const self = targets.get(String(selfMmsi));
	for (const target of targets.values()) {
		target.isValid = validPosition(target);
		target.lastSeen = ageSeconds(target.lastSeenDate, now);
		target.latitudeFormatted = coordinateText(target.latitude, true);
		target.longitudeFormatted = coordinateText(target.longitude, false);
		target.sogFormatted = Number.isFinite(target.sog)
			? `${(target.sog * 1.94384).toFixed(1)} kn`
			: "---";
		target.cogFormatted = angleText(target.cog);
		target.hdgFormatted = angleText(target.hdg);
		target.aisClassFormatted = target.aisClass || "---";
		target.sizeFormatted = `${numberText(target.length)} m x ${numberText(target.beam)} m`;
		target.rangeFormatted ??= "---";
		target.bearingFormatted ??= "---";
		target.cpaFormatted ??= "---";
		target.tcpaFormatted ??= "---";
		if (
			target.mmsi !== String(selfMmsi) &&
			validPosition(self) &&
			validPosition(target)
		) {
			target.range = distanceMetres(self, target);
			target.bearing = bearingDegrees(self, target);
			target.rangeFormatted = formatDistance(target.range, target.distanceUnit);
			target.bearingFormatted = `${target.bearing} T`;
		}
	}
	return self;
}

function validPosition(target) {
	return (
		Number.isFinite(Number(target?.latitude)) &&
		Number.isFinite(Number(target?.longitude))
	);
}

function distanceMetres(from, to) {
	const latitude1 = radians(from.latitude);
	const latitude2 = radians(to.latitude);
	const deltaLatitude = latitude2 - latitude1;
	const deltaLongitude = radians(to.longitude - from.longitude);
	const a =
		Math.sin(deltaLatitude / 2) ** 2 +
		Math.cos(latitude1) *
			Math.cos(latitude2) *
			Math.sin(deltaLongitude / 2) ** 2;
	return Math.round(2 * EARTH_RADIUS_METRES * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function bearingDegrees(from, to) {
	const latitude1 = radians(from.latitude);
	const latitude2 = radians(to.latitude);
	const deltaLongitude = radians(to.longitude - from.longitude);
	const y = Math.sin(deltaLongitude) * Math.cos(latitude2);
	const x =
		Math.cos(latitude1) * Math.sin(latitude2) -
		Math.sin(latitude1) * Math.cos(latitude2) * Math.cos(deltaLongitude);
	return Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
}

function radians(value) {
	return (Number(value) * Math.PI) / 180;
}

function formatDistance(metres, unit = "nmi") {
	const distance = Number(metres);
	if (!Number.isFinite(distance)) return "---";
	switch (normalizeDistanceUnit(unit)) {
		case "metric":
			return distance < 1000
				? `${Math.round(distance)} m`
				: `${(distance / 1000).toFixed(2)} km`;
		case "statute": {
			const feet = distance / 0.3048;
			return feet < 1000
				? `${Math.round(feet)} ft`
				: `${(distance / 1609.344).toFixed(2)} mi`;
		}
		default:
			return distance < 1000
				? `${Math.round(distance)} m`
				: `${(distance / 1852).toFixed(2)} NM`;
	}
}

function normalizeDistanceUnit(unit) {
	const text = String(unit || "").trim().toLowerCase();
	if (["m", "meter", "meters", "metre", "metres"].includes(text)) {
		return "metric";
	}
	if (
		["km", "kilometer", "kilometers", "kilometre", "kilometres"].includes(
			text,
		)
	) {
		return "metric";
	}
	if (["ft", "foot", "feet"].includes(text)) {
		return "statute";
	}
	if (["mi", "mile", "miles", "statutemile", "statutemiles"].includes(text)) {
		return "statute";
	}
	return "nmi";
}

function coordinateText(value, latitude) {
	if (!Number.isFinite(Number(value))) return "---";
	const number = Number(value);
	const absolute = Math.abs(number);
	const degrees = Math.floor(absolute);
	const minutes = ((absolute - degrees) * 60).toFixed(4);
	const hemisphere = latitude
		? number >= 0 ? "N" : "S"
		: number >= 0 ? "E" : "W";
	return `${hemisphere} ${degrees}° ${minutes}`;
}

function angleText(radiansValue) {
	if (!Number.isFinite(Number(radiansValue))) return "---";
	return `${Math.round(((Number(radiansValue) * 180) / Math.PI + 360) % 360)} T`;
}

function numberText(value) {
	return Number.isFinite(Number(value)) ? Number(value).toFixed(1) : "---";
}

function ageSeconds(value, now) {
	const timestamp = new Date(value).getTime();
	return Number.isFinite(timestamp) ? Math.max(0, Math.round((now - timestamp) / 1000)) : null;
}
