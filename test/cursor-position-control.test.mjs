import assert from "node:assert/strict";
import test from "node:test";

import {
	bearingDegrees,
	CURSOR_POSITION_STORAGE_KEY,
	createCursorPositionController,
	formatLatLon,
} from "../src/web/assets/scripts/cursor-position-control.mjs";

function fixture(stored = null) {
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
	const controller = createCursorPositionController({
		map: { on: (name, handler) => handlers.set(name, handler) },
		element,
		checkbox,
		getOwnPosition: () => ({ latitude: 56, longitude: -5 }),
		storage: {
			getItem: (key) => (key === CURSOR_POSITION_STORAGE_KEY ? stored : null),
			setItem: (key, value) => storageWrites.push([key, value]),
		},
	});
	controller.init();
	return { controller, handlers, element, checkbox, classes, storageWrites };
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
