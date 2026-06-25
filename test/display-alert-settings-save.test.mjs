import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyDisplayAlertSettings } from "../src/web/assets/scripts/speech-output-controls.mjs";

function memoryStorage() {
	const values = new Map();
	return {
		getItem(key) {
			return values.has(key) ? values.get(key) : null;
		},
		setItem(key, value) {
			values.set(key, String(value));
		},
	};
}

test("Display alert settings verify against local browser storage", () => {
	const storage = memoryStorage();
	const controls = {
		alertPanel: { checked: true },
		showAlarmPopup: { checked: false },
		alertPopupSound: { checked: true },
	};

	assert.equal(verifyDisplayAlertSettings({ controls, storage }), true);
	assert.equal(storage.getItem("checkShowAlertPanel"), "true");
	assert.equal(storage.getItem("checkShowPopupAlerts"), "false");
	assert.equal(storage.getItem("checkAlertPopupSound"), "true");
});

test("Display alert settings verification fails when storage cannot persist", () => {
	const storage = {
		getItem() {
			return null;
		},
		setItem() {},
	};
	const controls = {
		alertPanel: { checked: true },
		showAlarmPopup: { checked: true },
		alertPopupSound: { checked: true },
	};

	assert.throws(
		() => verifyDisplayAlertSettings({ controls, storage }),
		/Display setting checkShowAlertPanel did not verify/,
	);
});
