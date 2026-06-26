import assert from "node:assert/strict";
import test from "node:test";

import { normalizeCollisionProfiles } from "../src/web/assets/scripts/profile-settings-normalize.mjs";

test("profile normalizer preserves Traffic stationary automute settings", () => {
	const profiles = normalizeCollisionProfiles(
		{
			current: "coastal",
			anchor: { automuteStationary: false },
			harbor: { automuteStationary: true },
			coastal: { automuteStationary: true },
			offshore: { automuteStationary: false },
		},
		{
			current: "harbor",
			anchor: { automuteStationary: true },
			harbor: { automuteStationary: true },
			coastal: { automuteStationary: false },
			offshore: { automuteStationary: false },
		},
	);

	assert.equal(profiles.anchor.automuteStationary, false);
	assert.equal(profiles.harbor.automuteStationary, true);
	assert.equal(profiles.coastal.automuteStationary, true);
	assert.equal(profiles.offshore.automuteStationary, false);
});
