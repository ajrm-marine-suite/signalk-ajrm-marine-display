import {
	BASE_MAP_LAYER_SPECS,
	NATURAL_EARTH_MAX_DATA_ZOOM,
	NATURAL_EARTH_BASE_MAP_NAME,
} from "./chart-base-map-definitions.mjs";

export function createTileBaseMap({ L, spec }) {
	return L.tileLayer(spec.url, spec.options);
}

export function createTileBaseMaps({ L, specs = BASE_MAP_LAYER_SPECS }) {
	return Object.fromEntries(
		specs.map((spec) => [spec.name, createTileBaseMap({ L, spec })]),
	);
}

export function createNaturalEarthBaseMap({
	protomapsL,
	pmtilesUrl,
	paintRules,
	labelRules,
}) {
	return protomapsL.leafletLayer({
		url: pmtilesUrl,
		maxDataZoom: NATURAL_EARTH_MAX_DATA_ZOOM,
		paintRules,
		labelRules,
	});
}

export function createBaseMaps({ L, protomapsL, pmtilesUrl, paintRules, labelRules }) {
	return {
		...createTileBaseMaps({ L }),
		[NATURAL_EARTH_BASE_MAP_NAME]: createNaturalEarthBaseMap({
			protomapsL,
			pmtilesUrl,
			paintRules,
			labelRules,
		}),
	};
}
