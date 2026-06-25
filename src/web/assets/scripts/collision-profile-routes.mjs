export function getCollisionProfilesPath(_pluginId) {
	return `/signalk/v1/api/ajrmMarineDisplay/getCollisionProfiles`;
}

export function setCollisionProfilesPath(_pluginId) {
	return `/plugins/signalk-ajrm-marine-traffic/commands/profiles`;
}

export function refreshCollisionProfilesPath(_pluginId, timestamp = Date.now()) {
	return `${getCollisionProfilesPath(_pluginId)}?ts=${timestamp}`;
}
