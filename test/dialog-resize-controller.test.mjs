/** Verifies the explicit tide-dialog resize bounds used on desktop browsers. */

import assert from "node:assert/strict";
import test from "node:test";
import {
	DIALOG_SIZE_STORAGE_KEY,
	boundedDialogSize,
	createDialogResizeController,
	readSavedDialogSize,
} from "../src/web/assets/scripts/dialog-resize-controller.mjs";

test("dialog resizing follows the pointer within desktop bounds", () => {
	assert.deepEqual(boundedDialogSize({
		width: 700, height: 500, maxWidth: 1000, maxHeight: 700,
	}), { width: 700, height: 500 });
});

test("dialog resizing clamps oversized and undersized dimensions", () => {
	assert.deepEqual(boundedDialogSize({
		width: 1400, height: 900, maxWidth: 1000, maxHeight: 700,
	}), { width: 1000, height: 700 });
	assert.deepEqual(boundedDialogSize({
		width: 100, height: 100, maxWidth: 1000, maxHeight: 700,
	}), { width: 384, height: 320 });
});

test("saved dialog dimensions are validated", () => {
	const values = new Map([[DIALOG_SIZE_STORAGE_KEY, JSON.stringify({ width: 720, height: 540 })]]);
	const storage = { getItem: (key) => values.get(key) ?? null };
	assert.deepEqual(readSavedDialogSize(storage), { width: 720, height: 540 });
	values.set(DIALOG_SIZE_STORAGE_KEY, "not json");
	assert.equal(readSavedDialogSize(storage), null);
});

test("resize controller restores and saves dialog dimensions", () => {
	const values = new Map([[DIALOG_SIZE_STORAGE_KEY, JSON.stringify({ width: 700, height: 500 })]]);
	const storage = {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, value),
		removeItem: (key) => values.delete(key),
	};
	const handleListeners = new Map();
	const windowListeners = new Map();
	const styleValues = new Map();
	const dialog = {
		style: {
			set width(value) { styleValues.set("width", value); }, get width() { return styleValues.get("width"); },
			set height(value) { styleValues.set("height", value); }, get height() { return styleValues.get("height"); },
			set position(value) { styleValues.set("position", value); },
			set left(value) { styleValues.set("left", value); }, set top(value) { styleValues.set("top", value); },
			set margin(value) { styleValues.set("margin", value); },
			removeProperty: (key) => styleValues.delete(key),
		},
		getBoundingClientRect: () => ({ left: 100, top: 80, width: 730, height: 520 }),
	};
	const handle = {
		addEventListener: (name, listener) => handleListeners.set(name, listener),
		removeEventListener: () => {}, setPointerCapture: () => {}, releasePointerCapture: () => {},
	};
	const windowObject = {
		innerWidth: 1200, innerHeight: 800,
		addEventListener: (name, listener) => windowListeners.set(name, listener), removeEventListener: () => {},
	};
	createDialogResizeController({ dialog, handle, windowObject, storage });
	assert.equal(dialog.style.width, "700px");
	assert.equal(dialog.style.height, "500px");
	handleListeners.get("pointerdown")({ button: 0, pointerId: 1, clientX: 830, clientY: 600, preventDefault() {} });
	windowListeners.get("pointerup")({ pointerId: 1 });
	assert.deepEqual(JSON.parse(values.get(DIALOG_SIZE_STORAGE_KEY)), { width: 730, height: 520 });
	handleListeners.get("dblclick")();
	assert.equal(values.has(DIALOG_SIZE_STORAGE_KEY), false);
});
