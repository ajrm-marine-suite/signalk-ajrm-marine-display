import {
	createConfiguredAutoChartRuntime,
	createConfiguredMapBasics,
} from "./map-runtime-setup.mjs";

export function mapBasicsRuntimeArgs({ L, defaultMapZoom }) {
	return {
		L,
		defaultMapZoom,
	};
}

export function autoChartRuntimeArgs({
	L,
	protomapsL,
	pmtilesUrl,
	charts,
	map,
	easyButton,
	state,
	loadCharts,
	storage,
}) {
	return {
		L,
		protomapsL,
		pmtilesUrl,
		charts,
		map,
		easyButton,
		getSelfTarget: state.getSelfTarget,
		loadCharts,
		setDisableMoveend: state.setDisableMoveend,
		storage,
	};
}

export function mainMapChartRuntimeResult({
	map,
	easyButton,
	autoCharts,
	mapFollow,
	baseMaps,
	OpenSeaMap,
}) {
	return { map, easyButton, autoCharts, mapFollow, baseMaps, OpenSeaMap };
}

export function createMainMapChartRuntime({
	L,
	protomapsL,
	pmtilesUrl,
	charts,
	state,
	defaultMapZoom,
	loadCharts,
	storage,
	createMapBasics = createConfiguredMapBasics,
	createAutoChartRuntime = createConfiguredAutoChartRuntime,
}) {
	const { map, easyButton } = createMapBasics(mapBasicsRuntimeArgs({
		L,
		defaultMapZoom,
	}));
	const { autoCharts, mapFollow, baseMaps, OpenSeaMap } =
		createAutoChartRuntime(autoChartRuntimeArgs({
			L,
			protomapsL,
			pmtilesUrl,
			charts,
			map,
			easyButton,
			state,
			loadCharts,
			storage,
		}));

	return mainMapChartRuntimeResult({
		map,
		easyButton,
		autoCharts,
		mapFollow,
		baseMaps,
		OpenSeaMap,
	});
}
