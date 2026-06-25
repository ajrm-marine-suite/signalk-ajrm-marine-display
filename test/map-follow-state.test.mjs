import assert from "node:assert/strict";
import test from "node:test";
import { mapFollowButtonState } from "../src/web/assets/scripts/map-follow-state.mjs";

test("mapFollowButtonState returns active follow icon and title", () => {
	const state = mapFollowButtonState(true);
	assert.equal(state.title, "Following own vessel");
	assert.match(state.html, /ais-plus-control-icon/);
	assert.match(state.html, /Follow own vessel/);
	assert.doesNotMatch(state.html, /bi-cursor-fill/);
});

test("mapFollowButtonState returns paused follow icon and title", () => {
	const state = mapFollowButtonState(false);
	assert.equal(state.title, "Follow paused. Click to centre own vessel");
	assert.match(state.html, /ais-plus-control-icon/);
	assert.match(state.html, /Paused/);
	assert.doesNotMatch(state.html, /bi-slash-lg/);
});
