import assert from "node:assert/strict";
import { test } from "node:test";
import { shouldPlayPopupSound } from "../src/web/assets/scripts/alert-popup-state.mjs";

test("popup alert sound is local to Display and independent of suite mute", () => {
	assert.equal(
		shouldPlayPopupSound({ alertPopupSound: true, muted: true }),
		true,
	);
	assert.equal(
		shouldPlayPopupSound({ alertPopupSound: false, muted: false }),
		false,
	);
});
