import assert from "node:assert/strict";
import test from "node:test";
import {
	createVoyageObservationController,
	normalizeVoyageObservationStatus,
	voyageObservationPath,
	voyageObservationStatusPath,
} from "../src/web/assets/scripts/voyage-observation.mjs";

test("voyage observation routes use the normal Signal K API surface", () => {
	assert.equal(
		voyageObservationStatusPath("signalk-ajrm-marine-display"),
		"/signalk/v1/api/ajrmMarineDisplay/observations/status",
	);
	assert.equal(
		voyageObservationPath("signalk-ajrm-marine-display"),
		"/signalk/v1/api/ajrmMarineDisplay/observations",
	);
});

test("voyage observation status consumes explicit capability fields", () => {
	assert.deepEqual(
		normalizeVoyageObservationStatus({
			captureAvailable: true,
			voyageActive: true,
			voyageId: " voyage-1 ",
			snapshotAvailable: true,
			maximumTextCharacters: 2000,
		}),
		{
			captureAvailable: true,
			voyageActive: true,
			voyageId: "voyage-1",
			snapshotAvailable: true,
			maximumTextCharacters: 2000,
		},
	);
	assert.deepEqual(normalizeVoyageObservationStatus({ available: true }), {
		captureAvailable: false,
		voyageActive: false,
		voyageId: null,
		snapshotAvailable: false,
		maximumTextCharacters: 2000,
	});
});

test("observation controller enables an active voyage and saves text with a snapshot request", async () => {
	const controls = observationControls();
	const requests = [];
	const responses = [
		jsonResponse({
			captureAvailable: true,
			voyageActive: true,
			voyageId: "voyage-20260728T120000Z",
			snapshotAvailable: true,
			maximumTextCharacters: 2000,
		}),
		jsonResponse({
			ok: true,
			observation: {
				id: "observation-1",
				recordedAt: "2026-07-28T12:34:56.000Z",
			},
		}),
	];
	const controller = createVoyageObservationController({
		pluginId: "signalk-ajrm-marine-display",
		controls,
		async fetchFn(url, options) {
			requests.push({ url, options });
			return responses.shift();
		},
	});
	controller.init();

	await controller.refreshStatus();
	assert.equal(controls.save.disabled, false);
	assert.equal(controls.includeSnapshot.checked, true);
	assert.equal(controls.includeSnapshot.disabled, false);
	assert.equal(controls.text.maxLength, 2000);
	assert.match(controls.status.textContent, /voyage-20260728T120000Z/);

	controls.text.value = "  Rate of turn stayed visible.  ";
	assert.equal(await controller.submit({ preventDefault() {} }), true);
	assert.equal(controls.text.value, "");
	assert.match(
		controls.status.textContent,
		/Observation saved at \d{2}:\d{2}:\d{2}/,
	);
	assert.equal(requests[1].options.method, "POST");
	assert.deepEqual(JSON.parse(requests[1].options.body), {
		text: "Rate of turn stayed visible.",
		includeSnapshot: true,
	});
});

test("observation controller disables snapshot requests when capability is absent", () => {
	const controls = observationControls();
	const controller = createVoyageObservationController({
		pluginId: "signalk-ajrm-marine-display",
		controls,
		fetchFn: async () => jsonResponse({}),
	});

	controller.applyStatus({
		captureAvailable: true,
		voyageActive: true,
		voyageId: "voyage-1",
		snapshotAvailable: false,
		maximumTextCharacters: 2000,
	});

	assert.equal(controls.save.disabled, false);
	assert.equal(controls.includeSnapshot.disabled, true);
	assert.equal(controls.includeSnapshot.checked, false);
	assert.match(controls.snapshotHelp.textContent, /unavailable/);
});

test("observation controller reports when text is saved but snapshot evidence fails", async () => {
	const controls = observationControls();
	const responses = [
		jsonResponse({
			captureAvailable: true,
			voyageActive: true,
			voyageId: "voyage-1",
			snapshotAvailable: true,
			maximumTextCharacters: 2000,
		}),
		jsonResponse({
			ok: true,
			observation: {
				id: "observation-2",
				recordedAt: "2026-07-28T12:34:56.000Z",
				evidenceError: "Snapshot service unavailable",
			},
		}),
	];
	const controller = createVoyageObservationController({
		pluginId: "signalk-ajrm-marine-display",
		controls,
		async fetchFn() {
			return responses.shift();
		},
	});

	controller.init();
	await controller.refreshStatus();
	controls.text.value = "Depth call-out still visible.";

	assert.equal(await controller.submit({ preventDefault() {} }), true);
	assert.match(controls.status.textContent, /Observation saved at/);
	assert.match(controls.status.textContent, /snapshot failed/);
	assert.equal(controls.status.classList.contains("text-warning"), true);
});

test("observation controller does not invite a duplicate retry after a post-commit warning", async () => {
	const controls = observationControls();
	const responses = [
		jsonResponse({
			captureAvailable: true,
			voyageActive: true,
			voyageId: "voyage-1",
			snapshotAvailable: false,
			maximumTextCharacters: 2000,
		}),
		jsonResponse({
			ok: true,
			observation: {
				id: "observation-3",
				recordedAt: "2026-07-28T12:35:56.000Z",
				postCommitWarning: "index.json was not refreshed",
			},
		}),
	];
	const controller = createVoyageObservationController({
		pluginId: "signalk-ajrm-marine-display",
		controls,
		async fetchFn() {
			return responses.shift();
		},
	});

	controller.init();
	await controller.refreshStatus();
	controls.text.value = "A durable observation.";

	assert.equal(await controller.submit({ preventDefault() {} }), true);
	assert.equal(controls.text.value, "");
	assert.match(controls.status.textContent, /text is safe/);
	assert.match(controls.status.textContent, /must not be re-entered/);
	assert.equal(controls.status.classList.contains("text-warning"), true);
});

function observationControls() {
	return {
		modal: element(),
		form: element(),
		text: element({ value: "" }),
		includeSnapshot: element({ checked: true }),
		snapshotHelp: element(),
		status: element(),
		save: element({ disabled: true }),
	};
}

function element(initial = {}) {
	const classes = new Set();
	return {
		textContent: "",
		addEventListener() {},
		focus() {},
		classList: {
			toggle(name, enabled) {
				if (enabled) classes.add(name);
				else classes.delete(name);
			},
			contains(name) {
				return classes.has(name);
			},
		},
		...initial,
	};
}

function jsonResponse(body, status = 200) {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: "",
		async json() {
			return body;
		},
	};
}
