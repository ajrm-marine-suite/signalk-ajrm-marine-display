import {
	addChartScaleControl,
	chartScaleControlOptions,
	configuredMapOptions,
	createConfiguredMapBasics,
} from "./map-basics-setup.mjs";
import { resolveMapRuntimeFactories } from "./map-runtime-factories.mjs";
import {
	autoChartPosition,
	createAutoChartPositionGetter,
	createAutoChartRuntime,
	createMapFollowRuntime,
	createMapLayerRuntime,
} from "./map-runtime-setup-flow.mjs";

export { autoChartPosition };
export {
	addChartScaleControl,
	chartScaleControlOptions,
	configuredMapOptions,
	createConfiguredMapBasics,
};

export function createConfiguredAutoChartRuntime({
	L,
	protomapsL,
	pmtilesUrl,
	charts,
	map,
	easyButton,
	getSelfTarget,
	loadCharts,
	setDisableMoveend,
	storage,
	factories = {},
}) {
	const { createMapLayers, createAutoCharts, createMapFollow } =
		resolveMapRuntimeFactories(factories);
	const { paintRules, labelRules, baseMaps, OpenSeaMap } = createMapLayerRuntime({
		createMapLayers,
		L,
		protomapsL,
		pmtilesUrl,
	});

	let mapFollow;
	const getPosition = createAutoChartPositionGetter({
		map,
		getMapFollow: () => mapFollow,
		getSelfTarget,
	});
	const autoCharts = createAutoChartRuntime({
		createAutoCharts,
		L,
		protomapsL,
		map,
		charts,
		paintRules,
		labelRules,
		openSeaMap: OpenSeaMap,
		getPosition,
		loadCharts,
		storage,
	});
	mapFollow = createMapFollowRuntime({
		createMapFollow,
		easyButton,
		map,
		autoCharts,
		getSelfTarget,
		setDisableMoveend,
	});

	return {
		autoCharts,
		mapFollow,
		baseMaps,
		OpenSeaMap,
	};
}
