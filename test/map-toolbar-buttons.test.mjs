import assert from "node:assert/strict";
import test from "node:test";
import {
	createMapToolbarButtons,
	mapToolbarButtonSpecs,
	toggleOffcanvas,
} from "../src/web/assets/scripts/map-toolbar-buttons.mjs";

test("off-canvas toolbar actions close an already visible panel", () => {
	const calls = [];
	const classes = new Set();
	const instance = {
		show() {
			calls.push("show");
			classes.add("show");
		},
		hide() {
			calls.push("hide");
			classes.delete("show");
		},
	};
	const element = { classList: { contains: (name) => classes.has(name) } };
	toggleOffcanvas(instance, element);
	toggleOffcanvas(instance, element);
	assert.deepEqual(calls, ["show", "hide"]);
});

test("map toolbar keeps chart cycling directly below the chart selector", () => {
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
		[
			"Cycle chart",
			"AIS Targets",
			"Profiles",
			"Settings",
			"Routes",
			"Voyage observation",
			"Help",
		],
	);
	assert.equal(specs[0].title, "Cycle chart");
	for (const spec of specs) spec.action();
	assert.deepEqual(calls, [
		"buttonCycleChart",
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
		button: {
			attributes: {},
			setAttribute(name, value) {
				this.attributes[name] = value;
			},
		},
		addTo(target) {
			calls.push({ icon, action, title, target });
			return this;
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

	assert.equal(result.buttons.length, 7);
	assert.equal(calls.length, 7);
	assert.ok(calls.every((call) => call.target === map));
	assert.ok(result.buttons.every((button) => button.button.attributes["data-ajrm-map-help"]));
	assert.deepEqual(
		calls.map((call) => call.title),
		[
			"Cycle chart",
			"AIS Targets",
			"Profiles",
			"Settings",
			"Routes",
			"Voyage observation",
			"Help",
		],
	);
});
