import assert from "node:assert/strict";
import test from "node:test";
import { namedLayer } from "../src/web/assets/scripts/chart-layer-controller-actions.mjs";

test("namedLayer returns only explicit chart layer matches", () => {
	const naturalEarth = { name: "NaturalEarth" };
	const layers = {
		Empty: { name: "Empty" },
		"NaturalEarth (offline)": naturalEarth,
	};

	assert.equal(namedLayer(layers, "NaturalEarth (offline)"), naturalEarth);
	assert.equal(namedLayer(layers, "Missing"), null);
	assert.equal(namedLayer(null, "NaturalEarth (offline)"), null);
});
