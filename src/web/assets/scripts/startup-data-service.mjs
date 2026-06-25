import {
	chartResourcesPath,
	selfVesselPath,
	startupTargetsPath,
} from "./startup-data-routes.mjs";

export async function loadStartupData({ pluginId, getHttpResponse }) {
	const charts = await getHttpResponse(chartResourcesPath(), {
		throwErrors: false,
		ignore404: true,
		ignoreEmptyResponse: true,
	});

	const selfData = await getHttpResponse(selfVesselPath(), {
		throwErrors: false,
		ignoreEmptyResponse: true,
	});

	const initialPluginTargets = await getHttpResponse(startupTargetsPath(pluginId));

	return {
		charts,
		initialPluginTargets,
		selfMmsi: selfData?.mmsi || "self",
	};
}
