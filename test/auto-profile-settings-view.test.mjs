import assert from "node:assert/strict";
import test from "node:test";
import {
	applyAutoProfileSettingsToControls,
	applyAutoProfileStatusToControls,
	autoProfileSettingsFromResponse,
} from "../src/web/assets/scripts/auto-profile-settings-view.mjs";

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
