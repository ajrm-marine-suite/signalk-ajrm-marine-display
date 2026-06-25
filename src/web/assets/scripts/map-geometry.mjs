import { toDegrees, toRadians } from "../../../shared/ais-utils.mjs";

export function projectedLocation(start, bearingRadians, distanceMeters) {
	const radius = 6371e3;
	const [lat, lon] = start;
	const angularDistance = Number(distanceMeters) / radius;

	const lat1 = toRadians(Number(lat));
	const lon1 = toRadians(Number(lon));
	const sinLat1 = Math.sin(lat1);
	const cosLat1 = Math.cos(lat1);
	const sinAngularDistance = Math.sin(angularDistance);
	const cosAngularDistance = Math.cos(angularDistance);
	const sinBearing = Math.sin(bearingRadians);
	const cosBearing = Math.cos(bearingRadians);

	const sinLat2 =
		sinLat1 * cosAngularDistance +
		cosLat1 * sinAngularDistance * cosBearing;
	const lat2 = Math.asin(sinLat2);
	const y = sinBearing * sinAngularDistance * cosLat1;
	const x = cosAngularDistance - sinLat1 * sinLat2;
	const lon2 = lon1 + Math.atan2(y, x);

	return [toDegrees(lat2), ((toDegrees(lon2) + 540) % 360) - 180];
}
