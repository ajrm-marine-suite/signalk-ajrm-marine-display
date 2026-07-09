import assert from "node:assert/strict";
import test from "node:test";

globalThis.window = {
	requestAnimationFrame: (callback) => setTimeout(callback, 0),
	cancelAnimationFrame: (id) => clearTimeout(id),
	devicePixelRatio: 1,
	navigator: { userAgent: "node-test" },
	screen: {},
};
globalThis.document = {
	documentElement: { style: {} },
	createElement: () => ({ style: {}, getContext: () => null }),
	createElementNS: () => ({ style: {} }),
};

const {
	createRangeRingsController,
	rangeRingStep,
} = await import("../src/web/assets/scripts/range-rings.mjs");

function fakeLeaflet(calls) {
	const groupLayers = [];
	const group = {
		addLayer(layer) {
			groupLayers.push(layer);
			calls.push(["addLayer", layer.kind]);
		},
		addTo() {
			calls.push(["group.addTo"]);
		},
		clearLayers() {
			groupLayers.length = 0;
			calls.push(["group.clearLayers"]);
		},
		removeFrom() {
			calls.push(["group.removeFrom"]);
		},
	};
	return {
		layerGroup: () => group,
		circle: () => ({ kind: "circle" }),
		tooltip: () => ({ kind: "tooltip" }),
	};
}

test("range ring step uses the established nautical-mile intervals", () => {
	assert.equal(rangeRingStep(0.6), 0.125);
	assert.equal(rangeRingStep(1.2), 0.25);
	assert.equal(rangeRingStep(2.4), 0.5);
	assert.equal(rangeRingStep(5), 1);
	assert.equal(rangeRingStep(13), 2);
});

test("range rings can be cleared after drawing", () => {
	const calls = [];
	const map = {
		getBounds: () => ({
			getNorth: () => 56,
			getSouth: () => 55,
		}),
	};
	const rangeRings = createRangeRingsController({
		map,
		metersPerNm: 1852,
		leaflet: fakeLeaflet(calls),
	});

	assert.equal(rangeRings.draw({
		isValid: true,
		latitude: 55.5,
		longitude: -5.5,
	}), true);
	assert.equal(calls.filter(([name]) => name === "addLayer").length, 18);
	assert.equal(rangeRings.clear(), true);
	assert.deepEqual(calls.slice(-2), [["group.removeFrom"], ["group.clearLayers"]]);
	assert.equal(rangeRings.clear(), false);
});
