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
