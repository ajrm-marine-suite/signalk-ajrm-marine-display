/**
 * Defines API routes and access helpers for startup data in the AJRM Marine Display browser application.
 */

export function chartResourcesPath() {
	return "/signalk/v1/api/resources/charts";
}

export function selfVesselPath() {
	return "/signalk/v1/api/vessels/self";
}

export function startupTargetsPath(_pluginId) {
	return `/signalk/v1/api/ajrmMarineDisplay/getTargets`;
}
