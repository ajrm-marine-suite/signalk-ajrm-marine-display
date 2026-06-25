import assert from "node:assert/strict";
import test from "node:test";
import { registerMapFollowMoveEvents } from "../src/web/assets/scripts/map-follow-events.mjs";

function setup() {
	const handlers = {};
	const calls = [];
	const scheduled = [];
	let center = { lat: 53.75, lng: -4.7 };
	let zoom = 12;
	const map = {
		getCenter: () => center,
		getZoom: () => zoom,
		on(event, handler) {
			handlers[event] = handler;
		},
	};
	const state = {
		getDisableMoveend: () => false,
		getSelfTarget: () => ({ isValid: true }),
		setDisableMapPanTo: (value) => calls.push(["setDisableMapPanTo", value]),
		setMapFollowSelf: (value) => calls.push(["setMapFollowSelf", value]),
	};
	const autoCharts = {
		update: () => calls.push(["autoCharts.update"]),
	};
	const labelCollision = {
		update: () => calls.push(["labelCollision.update"]),
	};
	const drawRangeRings = () => calls.push(["drawRangeRings"]);

	registerMapFollowMoveEvents({
		map,
		state,
		autoCharts,
		drawRangeRings,
		labelCollision,
		schedule: (callback) => {
			scheduled.push(callback);
			callback();
		},
	});

	return {
		calls,
		handlers,
		scheduled,
		setCenter: (value) => {
			center = value;
		},
		setZoom: (value) => {
			zoom = value;
		},
	};
}

test("registered map move events pause follow after pan", () => {
	const { calls, handlers, setCenter } = setup();

	handlers.movestart();
	setCenter({ lat: 53.76, lng: -4.7 });
	handlers.moveend();

	assert.deepEqual(calls, [
		["setDisableMapPanTo", true],
		["setDisableMapPanTo", false],
		["setMapFollowSelf", false],
		["autoCharts.update"],
	]);
});

test("registered map move events keep follow after zoom-only move", () => {
	const { calls, handlers, setCenter, setZoom } = setup();

	handlers.movestart();
	setCenter({ lat: 53.76, lng: -4.7 });
	setZoom(13);
	handlers.moveend();

	assert.deepEqual(calls, [
		["setDisableMapPanTo", true],
		["setDisableMapPanTo", false],
		["autoCharts.update"],
	]);
});

test("registered zoom event refreshes range rings, labels, and auto charts", () => {
	const { calls, handlers } = setup();

	handlers.zoomend();

	assert.deepEqual(calls, [
		["drawRangeRings"],
		["labelCollision.update"],
		["autoCharts.update"],
	]);
});

test("registered map events coalesce auto chart updates in one scheduled frame", () => {
	const handlers = {};
	const calls = [];
	const scheduled = [];
	const map = {
		getCenter: () => ({ lat: 53.75, lng: -4.7 }),
		getZoom: () => 12,
		on(event, handler) {
			handlers[event] = handler;
		},
	};

	registerMapFollowMoveEvents({
		map,
		state: {
			getDisableMoveend: () => false,
			getSelfTarget: () => ({ isValid: true }),
			setDisableMapPanTo: (value) => calls.push(["setDisableMapPanTo", value]),
			setMapFollowSelf: (value) => calls.push(["setMapFollowSelf", value]),
		},
		autoCharts: {
			update: () => calls.push(["autoCharts.update"]),
		},
		drawRangeRings: () => calls.push(["drawRangeRings"]),
		labelCollision: {
			update: () => calls.push(["labelCollision.update"]),
		},
		schedule: (callback) => scheduled.push(callback),
	});

	handlers.movestart();
	handlers.zoomend();
	handlers.moveend();

	assert.equal(scheduled.length, 1);
	assert.equal(calls.filter(([name]) => name === "autoCharts.update").length, 0);

	scheduled[0]();

	assert.equal(calls.filter(([name]) => name === "autoCharts.update").length, 1);
});
