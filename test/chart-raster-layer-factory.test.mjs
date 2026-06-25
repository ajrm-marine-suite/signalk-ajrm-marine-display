import assert from "node:assert/strict";
import test from "node:test";
import {
	CHART_LAYER_Z_INDEX,
	CHART_TILE_MAX_ZOOM,
	EMPTY_ERROR_TILE,
} from "../src/web/assets/scripts/chart-layer-constants.mjs";
import {
	createRasterChartLayer,
	rasterChartLayerOptions,
} from "../src/web/assets/scripts/chart-raster-layer-factory.mjs";

test("rasterChartLayerOptions preserves chart tile presentation", () => {
	assert.deepEqual(rasterChartLayerOptions({ min: 7, max: 14 }), {
		maxNativeZoom: 14,
		minNativeZoom: 7,
		maxZoom: CHART_TILE_MAX_ZOOM,
		minZoom: 7,
		zIndex: CHART_LAYER_Z_INDEX,
		attribution: "",
		errorTileUrl: EMPTY_ERROR_TILE,
	});
});

test("createRasterChartLayer delegates to Leaflet tileLayer with derived options", () => {
	let tileLayerArgs;
	const layer = { addTo() {}, remove() {} };
	const result = createRasterChartLayer({
		L: {
			tileLayer(url, options) {
				tileLayerArgs = { url, options };
				return layer;
			},
		},
		url: "/chart/{z}/{x}/{y}.png",
		zoom: { min: 5, max: 9 },
	});

	assert.equal(result, layer);
	assert.equal(tileLayerArgs.url, "/chart/{z}/{x}/{y}.png");
	assert.deepEqual(tileLayerArgs.options, rasterChartLayerOptions({ min: 5, max: 9 }));
});
