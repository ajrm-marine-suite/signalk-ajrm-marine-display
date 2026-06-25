export function getTargetsPath(_pluginId, timestamp = Date.now()) {
	return `/signalk/v1/api/ajrmMarineDisplay/getTargets?ts=${timestamp}`;
}

export function silenceCurrentAlertsPath(_pluginId) {
	return `/plugins/signalk-ajrm-marine-traffic/commands/targets`;
}

export function unsilenceAllTargetsPath(_pluginId) {
	return `/plugins/signalk-ajrm-marine-traffic/commands/unsilence-all`;
}

export function setAlarmIsMutedPath(_pluginId, mmsi, _muted) {
	return `/plugins/signalk-ajrm-marine-traffic/commands/targets/${encodeURIComponent(mmsi)}/silence`;
}
