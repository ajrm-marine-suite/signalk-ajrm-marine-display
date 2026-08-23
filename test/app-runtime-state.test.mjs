import assert from "node:assert/strict";
import test from "node:test";

import { createAppRuntimeState } from "../src/web/assets/scripts/app-runtime-state.mjs";

test("app runtime state publishes self-target transitions and supports cleanup", () => {
	const state = createAppRuntimeState();
	const received = [];
	const unsubscribe = state.subscribeSelfTarget((target) => received.push(target));
	const first = { latitude: 56, longitude: -5 };
	const second = { latitude: 57, longitude: -6 };

	state.setSelfTarget(first);
	unsubscribe();
	state.setSelfTarget(second);

	assert.deepEqual(received, [first]);
	assert.equal(state.getSelfTarget(), second);
});

test("app runtime state isolates a failing self-target subscriber", () => {
	const state = createAppRuntimeState();
	const originalError = console.error;
	const errors = [];
	console.error = (...values) => errors.push(values);
	let received;

	try {
		state.subscribeSelfTarget(() => {
			throw new Error("subscriber failed");
		});
		state.subscribeSelfTarget((target) => {
			received = target;
		});
		state.setSelfTarget({ latitude: 56, longitude: -5 });
	} finally {
		console.error = originalError;
	}

	assert.deepEqual(received, { latitude: 56, longitude: -5 });
	assert.equal(errors.length, 1);
});

test("app runtime state publishes self-target subscribers in registration order", () => {
	const state = createAppRuntimeState();
	const calls = [];
	state.subscribeSelfTarget(() => calls.push("startup-position-gate"));
	state.subscribeSelfTarget(() => calls.push("environment-controller"));

	state.setSelfTarget({ latitude: 56, longitude: -5 });

	assert.deepEqual(calls, ["startup-position-gate", "environment-controller"]);
});
