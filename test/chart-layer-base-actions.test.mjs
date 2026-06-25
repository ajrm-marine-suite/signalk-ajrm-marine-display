import assert from "node:assert/strict";
import test from "node:test";
import {
	activeBaseLayers,
	removeActiveBaseLayers,
} from "../src/web/assets/scripts/chart-layer-base-actions.mjs";

function fakeLayer(name) {
	return { name };
}

function fakeMap(activeLayers) {
	const active = new Set(activeLayers);
	const removed = [];
	return {
		removed,
		hasLayer(layer) {
			return active.has(layer);
		},
		removeLayer(layer) {
			active.delete(layer);
			removed.push(layer.name);
		},
	};
}

test("activeBaseLayers returns only base layers currently on the map", () => {
	const empty = fakeLayer("Empty");
	const naturalEarth = fakeLayer("NaturalEarth");
	const map = fakeMap([naturalEarth]);

	assert.deepEqual(
		activeBaseLayers({
			map,
			baseMaps: { Empty: empty, NaturalEarth: naturalEarth },
		}),
		[naturalEarth],
	);
});

test("removeActiveBaseLayers removes only currently active base layers", () => {
	const empty = fakeLayer("Empty");
	const naturalEarth = fakeLayer("NaturalEarth");
	const map = fakeMap([empty]);

	removeActiveBaseLayers({
		map,
		baseMaps: { Empty: empty, NaturalEarth: naturalEarth },
	});

	assert.deepEqual(map.removed, ["Empty"]);
});
