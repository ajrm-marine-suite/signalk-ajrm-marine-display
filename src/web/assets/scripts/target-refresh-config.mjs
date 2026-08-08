/**
 * Builds configuration for target refresh in the AJRM Marine Display browser application.
 */

export function targetRefreshConfig({
	pluginId,
	map,
	getHttpResponse,
	targets,
	getSelfMmsi,
	setSelfTarget,
	getSelfTarget,
	targetSilence,
	serverAlertEvents,
	alertPopup,
	initialPluginTargets,
	targetMapRenderer,
	maximumTargetRange,
	targetMaxAge,
	ageOutEnabled,
	showAlarmsInterval,
	replayStatusControls,
}) {
	return {
		pluginId,
		map,
		getHttpResponse,
		targets,
		getSelfMmsi,
		setSelfTarget,
		getSelfTarget,
		targetSilence,
		serverAlertEvents,
		alertPopup,
		initialPluginTargets,
		targetMapRenderer,
		maximumTargetRange,
		targetMaxAge,
		ageOutEnabled,
		showAlarmsInterval,
		replayStatusControls,
	};
}
