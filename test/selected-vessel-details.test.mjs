import assert from "node:assert/strict";
import test from "node:test";
import {
	renderSelectedVesselDetails,
	resetSelectedVesselDetailsCache,
	setElementAttributeIfChanged,
	setElementClassPresenceIfChanged,
	setElementTextIfChanged,
} from "../src/web/assets/scripts/selected-vessel-details.mjs";

test("selected vessel details show placeholders for missing optional fields", () => {
	resetSelectedVesselDetailsCache();
	const elements = new Map();
	globalThis.document = {
		getElementById(id) {
			if (!elements.has(id)) {
				const attributes = new Map();
				elements.set(id, {
					classList: {
						add() {},
						remove() {},
					},
					getAttribute(name) {
						return attributes.get(name) ?? null;
					},
					setAttribute(name, value) {
						attributes.set(name, String(value));
					},
					textContent: "",
				});
			}
			return elements.get(id);
		},
		querySelectorAll() {
			return [];
		},
	};

	renderSelectedVesselDetails({
		target: { aisClass: "A", mmsi: "235900003" },
		targetSilence: { updateButtonMuteToggleIcon() {} },
		activateToolTips() {},
	});

	assert.equal(elements.get("target.draft").textContent, "---");
	assert.equal(
		elements.get("target.vesselFootprintSourceFormatted").textContent,
		"---",
	);
});

test("renderSelectedVesselDetails skips unchanged detail refreshes", () => {
	resetSelectedVesselDetailsCache();
	const calls = [];
	const elements = new Map();
	globalThis.document = {
		getElementById(id) {
			if (!elements.has(id)) {
				const attributes = new Map();
				elements.set(id, {
					classList: {
						add(name) {
							calls.push(["class-add", id, name]);
						},
						contains() {
							return false;
						},
						remove(name) {
							calls.push(["class-remove", id, name]);
						},
					},
					getAttribute(name) {
						return attributes.get(name) ?? null;
					},
					setAttribute(name, value) {
						calls.push(["attribute", id, name, value]);
						attributes.set(name, String(value));
					},
					textContent: "",
				});
			}
			return elements.get(id);
		},
		querySelectorAll() {
			return [];
		},
	};
	const target = {
		mmsi: "235900003",
		name: "Target One",
		aisClass: "A",
		cpaFormatted: "300 m",
		alarmIsMuted: false,
	};

	const first = renderSelectedVesselDetails({
		target,
		targetSilence: { updateButtonMuteToggleIcon: () => calls.push(["mute"]) },
		activateToolTips: () => calls.push(["tooltips"]),
	});
	const second = renderSelectedVesselDetails({
		target,
		targetSilence: { updateButtonMuteToggleIcon: () => calls.push(["mute"]) },
		activateToolTips: () => calls.push(["tooltips"]),
	});
	const third = renderSelectedVesselDetails({
		target: { ...target, cpaFormatted: "250 m" },
		targetSilence: { updateButtonMuteToggleIcon: () => calls.push(["mute"]) },
		activateToolTips: () => calls.push(["tooltips"]),
	});

	assert.equal(first, true);
	assert.equal(second, false);
	assert.equal(third, true);
	assert.equal(calls.filter(([name]) => name === "mute").length, 2);
	assert.equal(calls.filter(([name]) => name === "tooltips").length, 2);
	assert.equal(elements.get("target.cpaFormatted").textContent, "250 m");
});

test("setElementTextIfChanged skips unchanged selected-vessel text writes", () => {
	let text = "CPA 0.2 NM";
	const element = {
		writes: 0,
		get textContent() {
			return text;
		},
		set textContent(value) {
			text = value;
			this.writes += 1;
		},
	};

	assert.equal(setElementTextIfChanged(element, "CPA 0.2 NM"), false);
	assert.equal(element.writes, 0);
	assert.equal(setElementTextIfChanged(element, "CPA 40 m"), true);
	assert.equal(element.textContent, "CPA 40 m");
	assert.equal(element.writes, 1);
});

test("setElementAttributeIfChanged skips unchanged selected-vessel attributes", () => {
	const attributes = new Map([["data-bs-title", "United Kingdom"]]);
	const element = {
		writes: 0,
		getAttribute(name) {
			return attributes.get(name) ?? null;
		},
		setAttribute(name, value) {
			attributes.set(name, String(value));
			this.writes += 1;
		},
	};

	assert.equal(
		setElementAttributeIfChanged(element, "data-bs-title", "United Kingdom"),
		false,
	);
	assert.equal(element.writes, 0);
	assert.equal(
		setElementAttributeIfChanged(element, "data-bs-title", "Ireland"),
		true,
	);
	assert.equal(element.getAttribute("data-bs-title"), "Ireland");
	assert.equal(element.writes, 1);
});

test("setElementClassPresenceIfChanged skips unchanged selected-vessel classes", () => {
	const classes = new Set(["d-none"]);
	const calls = [];
	const element = {
		classList: {
			add(name) {
				calls.push(["add", name]);
				classes.add(name);
			},
			contains(name) {
				return classes.has(name);
			},
			remove(name) {
				calls.push(["remove", name]);
				classes.delete(name);
			},
		},
	};

	assert.equal(setElementClassPresenceIfChanged(element, "d-none", true), false);
	assert.deepEqual(calls, []);
	assert.equal(setElementClassPresenceIfChanged(element, "d-none", false), true);
	assert.deepEqual(calls, [["remove", "d-none"]]);
	assert.equal(setElementClassPresenceIfChanged(element, "alert-danger", true), true);
	assert.deepEqual(calls.at(-1), ["add", "alert-danger"]);
});
