import assert from "node:assert/strict";
import test from "node:test";
import {
	getCollisionProfilesPath,
	setCollisionProfilesPath,
} from "../src/web/assets/scripts/collision-profile-routes.mjs";

test("Display reads profiles through its compatibility API", () => {
	assert.equal(
		getCollisionProfilesPath("signalk-ajrm-marine-display"),
		"/signalk/v1/api/ajrmMarineDisplay/getCollisionProfiles",
	);
});

test("Display saves profile sensitivity through Traffic Core profile settings command", () => {
	assert.equal(
		setCollisionProfilesPath("signalk-ajrm-marine-display"),
		"/plugins/signalk-ajrm-marine-traffic/commands/profiles",
	);
});
