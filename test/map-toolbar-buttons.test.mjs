import assert from "node:assert/strict";
import test from "node:test";
import {
	createMapToolbarButtons,
	mapToolbarButtonSpecs,
} from "../src/web/assets/scripts/map-toolbar-buttons.mjs";

test("map toolbar includes voyage observations without disturbing established order", () => {
	const calls = [];
	const document = {
		getElementById(id) {
			return {
				click() {
					calls.push(id);
				},
			};
		},
	};
	const offcanvas = {
		targetList: { show: () => calls.push("targets") },
		profiles: { show: () => calls.push("profiles") },
		settings: { show: () => calls.push("settings") },
	};
	const specs = mapToolbarButtonSpecs({ offcanvas, document });

	assert.deepEqual(
		specs.map((spec) => spec.title),
		["AIS Targets", "Profiles", "Settings", "Routes", "Voyage observation", "Help"],
	);
	for (const spec of specs) spec.action();
	assert.deepEqual(calls, [
		"targets",
		"profiles",
		"settings",
		"buttonOpenRoutes",
		"buttonOpenObservation",
		"buttonOpenHelp",
	]);
});

test("map toolbar creates all buttons through the supplied EasyButton factory", () => {
	const calls = [];
	const map = { name: "map" };
	const easyButton = (icon, action, title) => ({
		addTo(target) {
			calls.push({ icon, action, title, target });
			return { title };
		},
	});

	const result = createMapToolbarButtons({
		map,
		easyButton,
		offcanvas: {
			targetList: { show() {} },
			profiles: { show() {} },
			settings: { show() {} },
		},
		document: { getElementById: () => null },
	});

	assert.equal(result.buttons.length, 6);
	assert.equal(calls.length, 6);
	assert.ok(calls.every((call) => call.target === map));
	assert.deepEqual(
		calls.map((call) => call.title),
		["AIS Targets", "Profiles", "Settings", "Routes", "Voyage observation", "Help"],
	);
});
