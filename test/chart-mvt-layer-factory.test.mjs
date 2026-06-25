import assert from "node:assert/strict";
import test from "node:test";
import { CHART_LAYER_Z_INDEX } from "../src/web/assets/scripts/chart-layer-constants.mjs";
import {
	createMvtChartLayer,
	isMvtChart,
	mvtChartLayerOptions,
} from "../src/web/assets/scripts/chart-mvt-layer-factory.mjs";

test("isMvtChart accepts Signal K vector chart format variants", () => {
	assert.equal(isMvtChart({ format: "mvt" }), true);
	assert.equal(isMvtChart({ type: "mvt" }), true);
	assert.equal(isMvtChart({ format: "png" }), false);
});

test("mvtChartLayerOptions preserves vector chart presentation", () => {
	const paintRules = [{ dataLayer: "water" }];
	const labelRules = [{ dataLayer: "places" }];

	assert.deepEqual(
		mvtChartLayerOptions({
			url: "/charts/vector.pmtiles",
			chart: { maxZoom: 12 },
			paintRules,
			labelRules,
		}),
		{
			url: "/charts/vector.pmtiles",
			maxDataZoom: 12,
			paintRules,
			labelRules,
			zIndex: CHART_LAYER_Z_INDEX,
		},
	);
});

test("createMvtChartLayer delegates to protomaps leafletLayer", () => {
	let layerOptions;
	const layer = { addTo() {}, remove() {} };
	const result = createMvtChartLayer({
		protomapsL: {
			leafletLayer(options) {
				layerOptions = options;
				return layer;
			},
		},
		url: "/charts/vector.pmtiles",
		chart: { maxzoom: 10 },
		paintRules: [],
		labelRules: [],
	});

	assert.equal(result, layer);
	assert.equal(layerOptions.maxDataZoom, 10);
	assert.equal(layerOptions.zIndex, CHART_LAYER_Z_INDEX);
});
