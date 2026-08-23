/**
 * Makes explicit decisions for map follow movement in the AJRM Marine Display browser application.
 */

export function mapCentersEqual(a, b, epsilon = 0.000001) {
	if (!a || !b) return false;
	return (
		Math.abs(Number(a.lat) - Number(b.lat)) <= epsilon &&
		Math.abs(Number(a.lng) - Number(b.lng)) <= epsilon
	);
}

export function shouldPauseFollowAfterMove({
	moveStartCenter,
	moveEndCenter,
	moveStartZoom,
	moveEndZoom,
	disableMoveend,
	selfTarget,
}) {
	if (disableMoveend) return false;
	if (!selfTarget?.isValid) return false;
	if (moveStartCenter == null || moveStartZoom == null) return false;
	if (moveEndCenter == null || moveEndZoom == null) return false;
	if (moveStartZoom !== moveEndZoom) return false;
	return !mapCentersEqual(moveStartCenter, moveEndCenter);
}
