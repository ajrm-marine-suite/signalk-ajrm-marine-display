import assert from "node:assert/strict";
import test from "node:test";
import {
	createAnchorController,
	formatDepth,
	validMark,
} from "../src/web/assets/scripts/anchor-controller.mjs";

function control() {
	return {
		hidden: false,
		disabled: false,
		textContent: "",
		listeners: {},
		classList: { toggle() {} },
		addEventListener(name, handler) {
			this.listeners[name] = handler;
		},
	};
}

test("anchor controller renders the recorded position and depth", () => {
	const calls = [];
	const marker = {
		addTo(map) {
			calls.push(["add", map]);
			return this;
		},
		removeFrom(map) {
			calls.push(["remove", map]);
		},
	};
	const L = {
		divIcon(options) {
			calls.push(["icon", options]);
			return options;
		},
		marker(position, options) {
			calls.push(["marker", position, options]);
			return marker;
		},
	};
	const controls = { drop: control(), clear: control(), status: control() };
	const controller = createAnchorController({ L, map: "map", controls });
	controller.render({
		active: true,
		currentProfile: "anchor",
		mark: {
			position: { latitude: 56.45, longitude: -5.45 },
			depthBelowKeelMeters: 4.2,
			droppedAt: "2026-08-08T12:00:00.000Z",
		},
	});

	assert.deepEqual(calls.find((call) => call[0] === "marker")[1], [56.45, -5.45]);
	assert.match(calls.find((call) => call[0] === "icon")[1].html, /4\.2 m below keel/);
	assert.equal(controls.drop.hidden, true);
	assert.equal(controls.clear.hidden, false);
	assert.equal(controls.status.textContent, "Anchor marked at 4.2 m below keel");

	controller.render({ active: false, currentProfile: "coastal", mark: null });
	assert.ok(calls.some((call) => call[0] === "remove"));
	assert.equal(controls.drop.hidden, false);
	assert.equal(controls.clear.hidden, true);
});

test("anchor helpers require numeric evidence and format metres", () => {
	assert.equal(
		validMark({
			position: { latitude: 0, longitude: 0 },
			depthBelowKeelMeters: 0,
		}),
		true,
	);
	assert.equal(validMark({ position: { latitude: 0, longitude: 0 } }), false);
	assert.equal(formatDepth(3.74), "3.7 m");
});
