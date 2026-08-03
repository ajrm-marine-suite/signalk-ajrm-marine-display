import assert from "node:assert/strict";
import test from "node:test";

import {
	bearingDegrees,
	CURSOR_POSITION_STORAGE_KEY,
	createCursorPositionController,
	formatLatLon,
} from "../src/web/assets/scripts/cursor-position-control.mjs";
import { COORDINATE_FORMAT_STORAGE_KEY } from "../src/web/assets/scripts/coordinate-format.mjs";

function fixture(stored = null, formatStored = null, defaultCoordinateFormat = "dms") {
	const handlers = new Map();
	const storageWrites = [];
	const classes = new Set(["d-none"]);
	const element = {
		textContent: "Cursor --",
		classList: {
			toggle(name, force) {
				if (force) classes.add(name);
				else classes.delete(name);
			},
		},
	};
	const checkbox = {
		checked: false,
		addEventListener(_name, handler) {
			this.onChange = handler;
		},
	};
	const formatSelect = {
		value: "",
		addEventListener(_name, handler) {
			this.onChange = handler;
		},
	};
	const controller = createCursorPositionController({
		map: { on: (name, handler) => handlers.set(name, handler) },
		element,
		checkbox,
		formatSelect,
		defaultCoordinateFormat,
		getOwnPosition: () => ({ latitude: 56, longitude: -5 }),
		storage: {
			getItem: (key) => {
				if (key === CURSOR_POSITION_STORAGE_KEY) return stored;
				if (key === COORDINATE_FORMAT_STORAGE_KEY) return formatStored;
				return null;
			},
			setItem: (key, value) => storageWrites.push([key, value]),
		},
	});
	controller.init();
	return {
		controller,
		handlers,
		element,
		checkbox,
		formatSelect,
		classes,
		storageWrites,
	};
}

test("cursor readout is disabled by default and persists the device preference", () => {
	const view = fixture();
	assert.equal(view.checkbox.checked, false);
	assert.equal(view.classes.has("d-none"), true);

	view.checkbox.checked = true;
	view.checkbox.onChange();
	assert.equal(view.classes.has("d-none"), false);
	assert.deepEqual(view.storageWrites, [[CURSOR_POSITION_STORAGE_KEY, "true"]]);
});

test("coordinate format uses the configured default and a remembered browser override", () => {
	const configured = fixture("true", null, "decimal");
	assert.equal(configured.formatSelect.value, "decimal");
	configured.handlers.get("mousemove")({ latlng: { lat: 56.01, lng: -5 } });
	assert.match(configured.element.textContent, /^Cursor 56\.010000°N 5\.000000°W/);

	const remembered = fixture("true", "degrees-minutes", "decimal");
	assert.equal(remembered.formatSelect.value, "degrees-minutes");
	remembered.formatSelect.value = "dms";
	remembered.formatSelect.onChange();
	assert.deepEqual(remembered.storageWrites, [
		[COORDINATE_FORMAT_STORAGE_KEY, "dms"],
	]);
});

test("cursor readout matches DR Plotter layout and includes own-vessel range", () => {
	const view = fixture("true");
	view.handlers.get("mousemove")({ latlng: { lat: 56.01, lng: -5 } });
	assert.match(
		view.element.textContent,
		/^Cursor 56° 00' 36\.0"N 5° 00' 0\.0"W/,
	);
	assert.match(view.element.textContent, / \| Range 0\.6 miles \/ 0 deg$/);

	view.handlers.get("mouseout")();
	assert.equal(view.element.textContent, "Cursor --");
});

test("coordinate and bearing helpers handle hemispheres and cardinal direction", () => {
	assert.equal(
		formatLatLon({ latitude: -1.5, longitude: 2.25 }),
		`1° 30' 0.0"S 2° 15' 0.0"E`,
	);
	assert.equal(
		Math.round(
			bearingDegrees(
				{ latitude: 56, longitude: -5 },
				{ latitude: 56, longitude: -4.9 },
			),
		),
		90,
	);
});
