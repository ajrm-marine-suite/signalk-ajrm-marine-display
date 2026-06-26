import assert from "node:assert/strict";
import test from "node:test";
import {
	applyAutoProfileSettingsToControls,
	applyAutoProfileStatusToControls,
	autoProfileSettingsFromResponse,
} from "../src/web/assets/scripts/auto-profile-settings-view.mjs";
import { createAutoProfileSettingsController } from "../src/web/assets/scripts/auto-profile-settings.mjs";

function controls() {
	return {
		enabled: { checked: false },
		status: {
			textContent: "",
			classList: {
				values: new Map(),
				toggle(name, value) {
					this.values.set(name, value);
				},
			},
		},
		validation: {
			textContent: "",
			classList: {
				values: new Map(),
				toggle(name, value) {
					this.values.set(name, value);
				},
			},
		},
	};
}

test("Auto Profile controls accept Traffic Core command response shape", () => {
	const ui = controls();
	const response = {
		ok: true,
		autoProfile: {
			profile: "coastal",
			status: "Auto Profile Switch ON.",
			settings: { enabled: true },
		},
	};
	assert.deepEqual(autoProfileSettingsFromResponse(response), { enabled: true });
	applyAutoProfileSettingsToControls({ controls: ui, settings: response });
	assert.equal(ui.enabled.checked, true);
});

test("Auto Profile status accepts Traffic Core projection fields", () => {
	const ui = controls();
	const calls = [];
	applyAutoProfileStatusToControls({
		controls: ui,
		status: {
			profile: "coastal",
			status: "Auto Profile Switch ON.",
			settings: { enabled: true },
		},
		currentProfile: "harbor",
		setCurrentProfile: (profile) => calls.push(["profile", profile]),
		updateSensitivityControls: (profile) => calls.push(["sensitivity", profile]),
	});
	assert.deepEqual(calls, [
		["profile", "coastal"],
		["sensitivity", "coastal"],
	]);
	assert.equal(ui.enabled.checked, true);
	assert.equal(ui.status.textContent, "Auto Profile Switch ON.");
	assert.equal(ui.status.classList.values.get("alert-warning"), false);
});

test("Auto Profile save keeps disabled command response instead of stale refresh state", async () => {
	const ui = controls();
	ui.enabled.checked = false;
	const originalFetch = globalThis.fetch;
	let postedBody = null;
	let refreshCalls = 0;
	globalThis.fetch = async (_url, options) => {
		postedBody = JSON.parse(options.body);
		return {
			ok: true,
			json: async () => ({
				ok: true,
				autoProfile: {
					profile: "harbor",
					status: "Auto selection OFF.",
					settings: { enabled: false },
				},
			}),
		};
	};

	try {
		const controller = createAutoProfileSettingsController({
			pluginId: "signalk-ajrm-marine-display",
			controls: ui,
			getCurrentProfile: () => "harbor",
			setCurrentProfile() {},
			updateSensitivityControls() {},
			getHttpResponse: async () => {
				refreshCalls += 1;
				return {
					autoProfileStatus: {
						message: "Stale ON.",
						options: { enabled: true },
					},
				};
			},
		});

		await controller.saveSettings();
	} finally {
		globalThis.fetch = originalFetch;
	}

	assert.deepEqual(postedBody, { enabled: false });
	assert.equal(refreshCalls, 0);
	assert.equal(ui.enabled.checked, false);
	assert.equal(ui.status.textContent, "Auto selection OFF.");
	assert.equal(ui.status.classList.values.get("alert-warning"), true);
});
