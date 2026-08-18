/** Verifies the explicit tide-dialog resize bounds used on desktop browsers. */

import assert from "node:assert/strict";
import test from "node:test";
import { boundedDialogSize } from "../src/web/assets/scripts/dialog-resize-controller.mjs";

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
