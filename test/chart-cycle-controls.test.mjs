import assert from "node:assert/strict";
import test from "node:test";
import {
	chartCycleMessage,
	createChartCycleControls,
	normalizeChartCycleShortcut,
} from "../src/web/assets/scripts/chart-cycle-controls.mjs";

test("chart cycle messages identify manual position and automatic return", () => {
	assert.equal(
		chartCycleMessage({
			mode: "manual",
			chart: { name: "Cuan Sound detail" },
			index: 2,
			total: 3,
		}),
		"Chart 2 of 3: Cuan Sound detail",
	);
	assert.equal(
		chartCycleMessage({ mode: "auto", chart: { name: "Admiralty 2326" } }),
		"Automatic chart: Admiralty 2326",
	);
	assert.equal(chartCycleMessage({ mode: "none", chart: null }), "No Auto chart — basemap shown");
});

test("chart cycle shortcut is browser-local and ignored while typing", () => {
	const listeners = {};
	const stored = new Map([["chartCycleShortcut", "x"]]);
	const shortcutInput = {
		value: "",
		addEventListener(type, listener) {
			listeners[`input:${type}`] = listener;
		},
	};
	const button = {
		disabled: false,
		setAttribute() {},
		addEventListener(type, listener) {
			listeners[`button:${type}`] = listener;
		},
	};
	const statusElement = {
		textContent: "",
		classList: { add() {}, remove() {} },
	};
	let cycles = 0;
	const controls = createChartCycleControls({
		autoCharts: {
			enabled: true,
			cycleChart() {
				cycles += 1;
				return { mode: "manual", chart: { name: "Test" }, index: 1, total: 1 };
			},
		},
		button,
		document: {
			addEventListener(type, listener) {
				listeners[`document:${type}`] = listener;
			},
		},
		shortcutInput,
		statusElement,
		storage: {
			getItem(key) {
				return stored.get(key);
			},
			setItem(key, value) {
				stored.set(key, value);
			},
		},
		schedule: () => 1,
	});
	controls.init();

	assert.equal(shortcutInput.value, "X");
	listeners["document:keydown"]({
		key: "x",
		target: { tagName: "DIV" },
		preventDefault() {},
	});
	listeners["document:keydown"]({
		key: "x",
		target: { tagName: "INPUT" },
		preventDefault() {},
	});
	assert.equal(cycles, 1);
	assert.equal(statusElement.textContent, "Chart 1 of 1: Test");

	shortcutInput.value = "z";
	listeners["input:change"]();
	assert.equal(controls.shortcut, "Z");
	assert.equal(stored.get("chartCycleShortcut"), "Z");
	assert.equal(normalizeChartCycleShortcut(""), "C");
});

test("chart cycle mouse and keyboard controls are disabled with Auto Charts", () => {
	const listeners = {};
	let enabledListener;
	let cycles = 0;
	let prevented = false;
	const button = {
		disabled: false,
		setAttribute() {},
		addEventListener(type, listener) { listeners[type] = listener; },
	};
	const autoCharts = {
		enabled: false,
		cycleChart() { cycles += 1; return { mode: "manual", chart: { name: "Test" } }; },
		onEnabledChange(listener) { enabledListener = listener; listener(this.enabled); },
	};
	const controls = createChartCycleControls({
		autoCharts,
		button,
		document: { addEventListener: (_type, listener) => { listeners.keydown = listener; } },
		storage: { getItem: () => "c" },
	});
	controls.init();
	assert.equal(button.disabled, true);
	listeners.click();
	listeners.keydown({ key: "c", target: { tagName: "DIV" }, preventDefault: () => { prevented = true; } });
	assert.equal(cycles, 0);
	assert.equal(prevented, false);

	autoCharts.enabled = true;
	enabledListener(true);
	assert.equal(button.disabled, false);
	listeners.keydown({ key: "c", target: { tagName: "DIV" }, preventDefault: () => { prevented = true; } });
	assert.equal(cycles, 1);
	assert.equal(prevented, true);
});
