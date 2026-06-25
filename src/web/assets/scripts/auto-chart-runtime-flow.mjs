export function autoChartPosition({ map, mapFollow, selfTarget }) {
	return mapFollow?.getMapFollowSelf() && selfTarget?.isValid
		? { lat: selfTarget.latitude, lng: selfTarget.longitude }
		: map.getCenter();
}

export function createAutoChartPositionGetter({ map, getMapFollow, getSelfTarget }) {
	return () =>
		autoChartPosition({
			map,
			mapFollow: getMapFollow(),
			selfTarget: getSelfTarget(),
		});
}

export function createAutoChartRuntime({
	createAutoCharts,
	L,
	protomapsL,
	map,
	charts,
	paintRules,
	labelRules,
	openSeaMap,
	getPosition,
	loadCharts,
	storage,
}) {
	return createAutoCharts({
		L,
		protomapsL,
		map,
		charts,
		paintRules,
		labelRules,
		openSeaMap,
		getPosition,
		loadCharts,
		storage,
	});
}
