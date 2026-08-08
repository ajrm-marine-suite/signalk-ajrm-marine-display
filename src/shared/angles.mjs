/**
 * Implements the angles responsibilities of the AJRM Marine Display.
 */

export function toRadians(degrees) {
	return (degrees * Math.PI) / 180;
}

export function toDegrees(radians) {
	return (radians * 180) / Math.PI;
}
