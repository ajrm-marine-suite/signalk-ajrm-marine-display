import { createBaseMaps } from "./chart-base-map-factory.mjs";
import { createProtomapsRules } from "./chart-protomaps-rules.mjs";
import { createOpenSeaMapLayer } from "./open-sea-map-layer.mjs";

export { createBaseMaps } from "./chart-base-map-factory.mjs";
export {
	BASE_MAP_LAYER_SPECS,
	NATURAL_EARTH_MAX_DATA_ZOOM,
	NATURAL_EARTH_BASE_MAP_NAME,
} from "./chart-base-map-definitions.mjs";
export {
	CHART_LAYER_Z_INDEX,
	CHART_TILE_MAX_ZOOM,
	SEAMARK_LAYER_Z_INDEX,
} from "./chart-layer-constants.mjs";
export { createProtomapsRules } from "./chart-protomaps-rules.mjs";
export {
	createOpenSeaMapLayer,
	OPEN_SEA_MAP_MAX_NATIVE_ZOOM,
	OPEN_SEA_MAP_TILE_URL,
	openSeaMapLayerOptions,
} from "./open-sea-map-layer.mjs";

export function createChartMapLayers({ L, protomapsL, pmtilesUrl }) {
	const { paintRules, labelRules } = createProtomapsRules(protomapsL);
	return {
		paintRules,
		labelRules,
		baseMaps: createBaseMaps({
			L,
			protomapsL,
			pmtilesUrl,
			paintRules,
			labelRules,
		}),
		OpenSeaMap: createOpenSeaMapLayer({ L }),
	};
}
