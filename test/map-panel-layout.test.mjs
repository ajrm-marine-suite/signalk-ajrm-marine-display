import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("left off-canvas panels leave the map toolbar exposed", async () => {
	const styles = await readFile(
		new URL("../src/web/assets/styles/styles.scss", import.meta.url),
		"utf8",
	);
	assert.match(styles, /\.offcanvas\.offcanvas-start\s*\{[^}]*left:\s*3\.25rem/s);
	assert.match(styles, /\.offcanvas\.offcanvas-start\s*\{[^}]*max-width:\s*calc\(100vw - 4rem\)/s);
	assert.match(styles, /\.leaflet-top\.leaflet-left\s*\{[^}]*z-index:\s*1050/s);
});
