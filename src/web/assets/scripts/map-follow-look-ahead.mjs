/**
 * Adapts shared AJRM Marine map-follow look-ahead helpers to Display targets.
 */

import {
	loadMapFollowLookAheadPercent,
	mapFollowLookAheadCenter,
	normalizeMapFollowLookAheadPercent,
	saveMapFollowLookAheadPercent,
} from "@ajrm-marine/map-core";

export {
	loadMapFollowLookAheadPercent,
	normalizeMapFollowLookAheadPercent,
	saveMapFollowLookAheadPercent,
};

export function mapFollowCenterForTarget({
	map,
	target,
	lookAheadPercent = loadMapFollowLookAheadPercent(),
}) {
	return mapFollowLookAheadCenter({
		map,
		position: {
			latitude: target?.latitude,
			longitude: target?.longitude,
		},
		cogRadians: target?.cog,
		lookAheadPercent,
	});
}
