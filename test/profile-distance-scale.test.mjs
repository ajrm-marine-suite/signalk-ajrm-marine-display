import assert from "node:assert/strict";
import test from "node:test";

import {
	distanceToTick,
	tickToDistance,
} from "../src/web/assets/scripts/range-control-scales.mjs";
import { distanceDisplayState } from "../src/web/assets/scripts/profile-edit-display-state.mjs";

test("profile CPA distance controls store metres while displaying marine units", () => {
	assert.equal(tickToDistance(distanceToTick(25)), 25);
	assert.equal(tickToDistance(distanceToTick(1852)), 1852);
	assert.equal(tickToDistance(distanceToTick(2778)), 2778);
	assert.deepEqual(distanceDisplayState(250), {
		text: 250,
		unitsHidden: false,
		unitsText: " m",
	});
	assert.deepEqual(distanceDisplayState(2778), {
		text: 1.5,
		unitsHidden: false,
		unitsText: " NM",
	});
});
