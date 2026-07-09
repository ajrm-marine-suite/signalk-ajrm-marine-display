import assert from "node:assert/strict";
import test from "node:test";

import { cpaLimitRingRadiusMeters } from "../src/web/assets/scripts/target-overlay-state.mjs";

test("CPA limit ring radii use metre profile values directly", () => {
	assert.equal(
		cpaLimitRingRadiusMeters({
			criteria: { cpa: 1481.6 },
			cpaSensitivity: 1,
			metersPerNm: 1852,
		}),
		1481.6,
	);
	assert.ok(
		Math.abs(
			cpaLimitRingRadiusMeters({
				criteria: { cpa: 740.8 },
				cpaSensitivity: 1.5,
				metersPerNm: 1852,
			}) - 1111.2,
		) < 0.000001,
	);
});

test("CPA limit ring radii do not multiply metre CPA values by nautical mile metres", () => {
	assert.notEqual(
		cpaLimitRingRadiusMeters({
			criteria: { cpa: 740.8 },
			cpaSensitivity: 1.5,
			metersPerNm: 1852,
		}),
		1111.2 * 1852,
	);
});
