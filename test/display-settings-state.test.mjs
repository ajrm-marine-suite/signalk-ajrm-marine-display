import assert from "node:assert/strict";
import test from "node:test";
import {
	DARK_MAP_FILTER,
	colorModeState,
	fullscreenChecked,
	storedCheckboxValue,
} from "../src/web/assets/scripts/display-settings-state.mjs";

test("colorModeState maps checkbox state to Bootstrap theme and map filter", () => {
	assert.deepEqual(colorModeState(true), {
		theme: "dark",
		mapFilter: DARK_MAP_FILTER,
	});
	assert.deepEqual(colorModeState(false), {
		theme: "light",
		mapFilter: "none",
	});
});

test("storedCheckboxValue treats only the string true as checked", () => {
	const values = new Map([
		["enabled", "true"],
		["disabled", "false"],
	]);
	const storage = { getItem: (key) => values.get(key) ?? null };
	assert.equal(storedCheckboxValue(storage, "enabled"), true);
	assert.equal(storedCheckboxValue(storage, "disabled"), false);
	assert.equal(storedCheckboxValue(storage, "missing"), false);
});

test("fullscreenChecked reflects current fullscreen element presence", () => {
	assert.equal(fullscreenChecked({}), true);
	assert.equal(fullscreenChecked(null), false);
});
