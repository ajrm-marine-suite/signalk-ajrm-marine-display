export function recenterOnSelfTarget({
	map,
	buttonMap,
	autoCharts,
	getSelfTarget,
	setDisableMoveend,
	setMapFollowSelf,
}) {
	const selfTarget = getSelfTarget();
	if (!selfTarget?.isValid) return;

	try {
		setMapFollowSelf(true);
		setDisableMoveend(true);
		(buttonMap || map).panTo([selfTarget.latitude, selfTarget.longitude], {
			animate: false,
		});
		autoCharts.update();
	} finally {
		setDisableMoveend(false);
	}
}
