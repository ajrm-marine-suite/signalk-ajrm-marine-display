export const DEFAULT_GPS_FROM_BOW_FRACTION = 0.75;
export const DEFAULT_CLASS_A_GPS_FROM_BOW_FRACTION = 0.85;
export const DEFAULT_BEAM_TO_LENGTH_RATIO = 0.15;

export function finitePositive(value) {
	const number = Number(value);
	return Number.isFinite(number) && number > 0 ? number : null;
}

export function clamp(value, min, max) {
	const number = Number(value);
	if (!Number.isFinite(number)) return min;
	return Math.min(max, Math.max(min, number));
}

export function targetLengthMeters(target = {}, options = {}) {
	const actual = finitePositive(target.length);
	if (actual) return actual;
	if (String(target.aisClass || "").toUpperCase() === "B") {
		return finitePositive(options.assumedClassBLengthMeters);
	}
	if (String(target.aisClass || "").toUpperCase() === "A") {
		return finitePositive(options.assumedClassALengthMeters);
	}
	return finitePositive(options.assumedUnknownLengthMeters);
}

export function targetBeamMeters(target = {}, length, options = {}) {
	return (
		finitePositive(target.beam) ||
		(length
			? length *
				clamp(
					options.assumedBeamToLengthRatio ?? DEFAULT_BEAM_TO_LENGTH_RATIO,
					0.03,
					0.5,
				)
			: null)
	);
}

export function vesselFootprint(target = {}, options = {}) {
	const length = targetLengthMeters(target, options);
	const beam = targetBeamMeters(target, length, options);
	const heading = Number.isFinite(Number(target.hdg))
		? Number(target.hdg)
		: Number(target.cog);
	if (!length || !beam || !Number.isFinite(heading)) return null;
	const toBow = finitePositive(target.dimensionToBow);
	const toStern = finitePositive(target.dimensionToStern);
	const toPort = finitePositive(target.dimensionToPort);
	const toStarboard = finitePositive(target.dimensionToStarboard);
	return {
		length,
		beam,
		heading,
		toBow: toBow ?? length,
		toStern: toStern ?? length,
		toPort: toPort ?? beam,
		toStarboard: toStarboard ?? beam,
		source: toBow && toStern && toPort && toStarboard ? "ais" : "assumed",
	};
}

export function gpsFromBowFractionFor(target = {}, options = {}) {
	const aisClass = String(target.aisClass || "").toUpperCase();
	const configured =
		aisClass === "A"
			? (options.classAGpsFromBowFraction ??
				options.vesselGpsFromBowFraction ??
				DEFAULT_CLASS_A_GPS_FROM_BOW_FRACTION)
			: (options.vesselGpsFromBowFraction ?? DEFAULT_GPS_FROM_BOW_FRACTION);
	return clamp(configured, 0, 1);
}

export function pointToFootprintDistanceMeters(point, target = {}, options = {}) {
	const footprint = vesselFootprint(target, options);
	if (
		!footprint ||
		!Number.isFinite(point?.x) ||
		!Number.isFinite(point?.y) ||
		!Number.isFinite(target.x) ||
		!Number.isFinite(target.y)
	) {
		return null;
	}
	const toPort = finitePositive(target.dimensionToPort) ?? footprint.beam;
	const toStarboard =
		finitePositive(target.dimensionToStarboard) ?? footprint.beam;
	const dx = point.x - target.x;
	const dy = point.y - target.y;
	const local = {
		stbd: dx * Math.cos(footprint.heading) - dy * Math.sin(footprint.heading),
		fwd: dx * Math.sin(footprint.heading) + dy * Math.cos(footprint.heading),
	};
	const outsideX = Math.max(
		-toPort - local.stbd,
		0,
		local.stbd - toStarboard,
	);
	const outsideY = Math.max(
		-footprint.toStern - local.fwd,
		0,
		local.fwd - footprint.toBow,
	);
	return Math.sqrt(outsideX * outsideX + outsideY * outsideY);
}

export function footprintLatLngs(target = {}, options = {}) {
	const footprint = vesselFootprint(target, options);
	const lat = Number(target.latitude);
	const lon = Number(target.longitude);
	if (!footprint || !Number.isFinite(lat) || !Number.isFinite(lon)) return [];
	const cosLat = Math.cos((lat * Math.PI) / 180);
	if (!cosLat) return [];
	const localCorners = [
		{ stbd: -footprint.toPort, fwd: footprint.toBow },
		{ stbd: footprint.toStarboard, fwd: footprint.toBow },
		{ stbd: footprint.toStarboard, fwd: -footprint.toStern },
		{ stbd: -footprint.toPort, fwd: -footprint.toStern },
	];
	return localCorners.map((local) => {
		const dx =
			local.stbd * Math.cos(footprint.heading) +
			local.fwd * Math.sin(footprint.heading);
		const dy =
			-local.stbd * Math.sin(footprint.heading) +
			local.fwd * Math.cos(footprint.heading);
		return [lat + dy / 111120, lon + dx / (111120 * cosLat)];
	});
}
