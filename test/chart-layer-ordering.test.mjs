import assert from "node:assert/strict";
import test from "node:test";
import {
	CHART_LAYER_Z_INDEX,
	SEAMARK_LAYER_Z_INDEX,
} from "../src/web/assets/scripts/chart-layer-constants.mjs";
import { keepChartLayersOnTop } from "../src/web/assets/scripts/chart-layer-ordering.mjs";

function fakeLayer(name, calls) {
	return {
		name,
		addTo() {},
		remove() {},
		setZIndex(value) {
			calls.push(`${name}:z:${value}`);
		},
		bringToFront() {
			calls.push(`${name}:front`);
		},
	};
}

function fakeGroup(layers) {
	return {
		eachLayer(callback) {
			for (const layer of layers) callback(layer);
		},
	};
}

test("keepChartLayersOnTop puts chart layers below the OpenSeaMap seamark overlay", () => {
	const calls = [];
	const chartLayer = fakeLayer("chart", calls);
	const openSeaMap = fakeLayer("OpenSeaMap", calls);
	const map = {
		hasLayer(layer) {
			return layer === openSeaMap;
		},
	};

	keepChartLayersOnTop({
		group: fakeGroup([chartLayer]),
		map,
		openSeaMap,
	});

	assert.deepEqual(calls, [
		`chart:z:${CHART_LAYER_Z_INDEX}`,
		"chart:front",
		`OpenSeaMap:z:${SEAMARK_LAYER_Z_INDEX}`,
		"OpenSeaMap:front",
	]);
});

test("keepChartLayersOnTop ignores invalid layers and absent OpenSeaMap", () => {
	const calls = [];
	const chartLayer = fakeLayer("chart", calls);

	keepChartLayersOnTop({
		group: fakeGroup([{}, chartLayer]),
		map: { hasLayer: () => false },
		openSeaMap: fakeLayer("OpenSeaMap", calls),
	});

	assert.deepEqual(calls, [`chart:z:${CHART_LAYER_Z_INDEX}`, "chart:front"]);
});
