/**
 * Coordinates control flow for map follow runtime in the AJRM Marine Display browser application.
 */

export function createMapFollowRuntime({
	createMapFollow,
	easyButton,
	map,
	autoCharts,
	getSelfTarget,
	setDisableMoveend,
}) {
	return createMapFollow({
		easyButton,
		map,
		autoCharts,
		getSelfTarget,
		setDisableMoveend,
	});
}
