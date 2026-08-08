/**
 * Provides actions for map follow in the AJRM Marine Display browser application.
 */

import { mapFollowCenterForTarget } from "./map-follow-look-ahead.mjs";

export function recenterOnSelfTarget({
	map,
	buttonMap,
	autoCharts,
	getSelfTarget,
	setDisableMoveend,
	setMapFollowSelf,
	getLookAheadPercent,
}) {
	const selfTarget = getSelfTarget();
	if (!selfTarget?.isValid) return;

	try {
		setMapFollowSelf(true);
		setDisableMoveend(true);
		const activeMap = buttonMap || map;
		activeMap.panTo(mapFollowCenterForTarget({
			map: activeMap,
			target: selfTarget,
			lookAheadPercent: getLookAheadPercent?.(),
		}), {
			animate: false,
		});
		autoCharts.update();
	} finally {
		setDisableMoveend(false);
	}
}
