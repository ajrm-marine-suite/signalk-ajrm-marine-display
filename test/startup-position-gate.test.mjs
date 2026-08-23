import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

import {
	centerMapOnPosition,
	createStartupPositionGate,
	currentVesselPosition,
} from "../src/web/assets/scripts/startup-position-gate.mjs";

test("Display ships a pre-script position cover and wires it to live target state", async () => {
	const [html, main] = await Promise.all([
		fs.readFile(new URL("../src/web/index.html", import.meta.url), "utf8"),
		fs.readFile(
			new URL("../src/web/assets/scripts/main.mjs", import.meta.url),
			"utf8",
		),
	]);
	assert.match(html, /<body class="ajrm-marine-position-pending">/);
	assert.match(html, /id="displayPositionGate"/);
	assert.match(html, /body\.ajrm-marine-position-pending #map[\s\S]*?visibility: hidden/);
	assert.match(main, /createStartupPositionGate\(\{/);
	assert.match(main, /getOwnPosition: state\.getSelfTarget/);
	assert.match(main, /state\.subscribeSelfTarget/);
	assert.match(
		main,
		/onResolved: \(\{ positionSource \}\) => revealInitialChart\(positionSource\)/,
	);
	assert.ok(
		main.indexOf("subscribeSelfTarget: state.subscribeSelfTarget") <
			main.indexOf("state.subscribeSelfTarget((target)"),
		"the startup gate must subscribe before the environment controller",
	);
});

function setup({ initialTarget, timeoutMs = 15000 } = {}) {
	const calls = [];
	const listeners = new Set();
	let target = initialTarget;
	let timeoutCallback;
	let clearedTimeout;
	const map = {
		getZoom: () => 12,
		setView: (...args) => calls.push(["setView", ...args]),
	};
	const gate = createStartupPositionGate({
		map,
		getSelfTarget: () => target,
		subscribeSelfTarget: (listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		onWaiting: (result) => calls.push(["waiting", result]),
		onResolved: (result) => calls.push(["resolved", result]),
		onUnavailable: (result) => calls.push(["unavailable", result]),
		timeoutMs,
		setTimeoutFn: (callback) => {
			timeoutCallback = callback;
			return 42;
		},
		clearTimeoutFn: (id) => {
			clearedTimeout = id;
		},
	});

	return {
		calls,
		gate,
		listeners,
		getClearedTimeout: () => clearedTimeout,
		publish(nextTarget) {
			target = nextTarget;
			for (const listener of listeners) listener(nextTarget);
		},
		timeout() {
			timeoutCallback();
		},
	};
}

test("startup position gate centres the map before revealing a current fix", () => {
	const fixture = setup();
	fixture.gate.start();
	fixture.publish({
		isValid: true,
		latitude: 56.27224,
		longitude: -5.637656,
	});

	assert.equal(fixture.calls[0][0], "waiting");
	assert.deepEqual(fixture.calls[1], [
		"setView",
		[56.27224, -5.637656],
		12,
		{ animate: false },
	]);
	assert.equal(fixture.calls[2][0], "resolved");
	assert.deepEqual(fixture.calls[2][1].position, {
		latitude: 56.27224,
		longitude: -5.637656,
		isLastKnown: false,
		positionSource: "fresh",
	});
	assert.equal(fixture.calls[2][1].positionSource, "fresh");
	assert.equal(fixture.calls[2][1].isLastKnown, false);
	assert.equal(fixture.gate.getState(), "resolved");
	assert.equal(fixture.listeners.size, 0);
	assert.equal(fixture.getClearedTimeout(), 42);
});

test("startup position gate resolves an already available current fix", () => {
	const fixture = setup({
		initialTarget: { latitude: 55.8, longitude: -5.2 },
	});

	assert.equal(fixture.gate.start(), true);

	assert.deepEqual(
		fixture.calls.map(([name]) => name),
		["waiting", "setView", "resolved"],
	);
	assert.equal(fixture.gate.getState(), "resolved");
	assert.equal(fixture.listeners.size, 0);
	assert.equal(fixture.getClearedTimeout(), undefined);
});

test("startup position gate centres and resolves a retained last-known position", () => {
	const fixture = setup({
		initialTarget: {
			isValid: true,
			isStale: true,
			latitude: 55.8,
			longitude: -5.2,
		},
	});
	fixture.gate.start();

	assert.deepEqual(
		fixture.calls.map(([name]) => name),
		["waiting", "setView", "resolved"],
	);
	assert.equal(fixture.calls[2][1].positionSource, "last-known");
	assert.equal(fixture.calls[2][1].isLastKnown, true);
	assert.deepEqual(fixture.calls[2][1].position, {
		latitude: 55.8,
		longitude: -5.2,
		isLastKnown: true,
		positionSource: "last-known",
	});
	assert.equal(fixture.gate.getState(), "resolved");
});

test("startup position gate reports timeout but still accepts a later GPS fix", () => {
	const fixture = setup({ timeoutMs: 25 });
	fixture.gate.start();
	fixture.timeout();

	assert.equal(fixture.gate.getState(), "unavailable");
	assert.deepEqual(fixture.calls[1], [
		"unavailable",
		{ state: "unavailable", reason: "timeout", timeoutMs: 25 },
	]);
	assert.equal(fixture.listeners.size, 1);

	fixture.publish({ latitude: 56.5, longitude: -5.5 });

	assert.deepEqual(
		fixture.calls.map(([name]) => name),
		["waiting", "unavailable", "setView", "resolved"],
	);
	assert.equal(fixture.calls[3][1].previousState, "unavailable");
	assert.equal(fixture.listeners.size, 0);
});

test("startup position gate stop clears waiting resources", () => {
	const fixture = setup();
	fixture.gate.start();

	assert.equal(fixture.gate.stop(), true);
	fixture.publish({ latitude: 56, longitude: -5 });

	assert.equal(fixture.gate.getState(), "stopped");
	assert.equal(fixture.listeners.size, 0);
	assert.equal(fixture.getClearedTimeout(), 42);
	assert.deepEqual(
		fixture.calls.map(([name]) => name),
		["waiting"],
	);
});

test("currentVesselPosition validates bounds and classifies freshness", () => {
	assert.deepEqual(currentVesselPosition({ latitude: "56", longitude: "-5" }), {
		latitude: 56,
		longitude: -5,
		isLastKnown: false,
		positionSource: "fresh",
	});
	assert.equal(currentVesselPosition({ latitude: 91, longitude: -5 }), null);
	assert.equal(currentVesselPosition({ latitude: 56, longitude: -181 }), null);
	assert.deepEqual(
		currentVesselPosition({ latitude: 56, longitude: -5, isStale: true }),
		{
			latitude: 56,
			longitude: -5,
			isLastKnown: true,
			positionSource: "last-known",
		},
	);
	assert.equal(
		currentVesselPosition({ latitude: 56, longitude: -5, isValid: false }),
		null,
	);
});

test("centerMapOnPosition leaves zoom unspecified when map has no current zoom", () => {
	const calls = [];
	centerMapOnPosition(
		{ setView: (...args) => calls.push(args) },
		{ latitude: 56, longitude: -5 },
	);

	assert.deepEqual(calls, [[[56, -5], undefined, { animate: false }]]);
});
