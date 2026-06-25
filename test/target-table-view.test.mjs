import assert from "node:assert/strict";
import test from "node:test";
import { updateTargetTableView } from "../src/web/assets/scripts/target-table-view.mjs";

test("updateTargetTableView renders target rows and refreshes silence controls", () => {
	const elements = {
		tableOfTargetsBody: { innerHTML: "" },
		numberOfAisTargets: { textContent: "" },
	};
	const document = {
		getElementById(id) {
			return elements[id];
		},
	};
	let silenceControlsUpdated = 0;
	const targets = new Map([
		[
			"235900001",
			{
				mmsi: "235900001",
				name: "NORTH CHANNEL",
				isValid: true,
				range: 1852,
				rangeFormatted: "1.00 NM",
				bearingFormatted: "270 T",
				cpaFormatted: "---",
				tcpaFormatted: "---",
				priority: 1,
			},
		],
	]);

	updateTargetTableView({
		document,
		targets,
		selfMmsi: "235008635",
		sortBy: "range",
		targetSilence: {
			updateGlobalSilenceControls() {
				silenceControlsUpdated += 1;
			},
		},
		getTargetSvgFn: () => "<svg></svg>",
	});

	assert.match(elements.tableOfTargetsBody.innerHTML, /NORTH CHANNEL/);
	assert.equal(elements.numberOfAisTargets.textContent, 1);
	assert.equal(silenceControlsUpdated, 1);
});

test("updateTargetTableView uses placeholders for replay targets missing navigation fields", () => {
	const elements = {
		tableOfTargetsBody: { innerHTML: "" },
		numberOfAisTargets: { textContent: "" },
	};
	const document = {
		getElementById(id) {
			return elements[id];
		},
	};
	const targets = new Map([
		[
			"235900003",
			{
				mmsi: "235900003",
				name: "FAST FERRY ONE",
				isValid: true,
				cpa: 382,
				tcpa: 448,
				cpaFormatted: "382 m",
				tcpaFormatted: "07:28",
				spokenSummary:
					"Collision alarm. Fast large vessel Fast Ferry One at 10 o'clock.",
			},
		],
	]);

	updateTargetTableView({
		document,
		targets,
		selfMmsi: "235008635",
		sortBy: "range",
		targetSilence: {
			updateGlobalSilenceControls() {},
		},
		getTargetSvgFn: () => "<svg></svg>",
	});

	assert.match(elements.tableOfTargetsBody.innerHTML, /FAST FERRY ONE/);
	assert.match(elements.tableOfTargetsBody.innerHTML, /---/);
	assert.doesNotMatch(elements.tableOfTargetsBody.innerHTML, /undefined/);
	assert.equal(elements.numberOfAisTargets.textContent, 1);
});

test("updateTargetTableView skips unchanged table DOM writes", () => {
	const writes = [];
	const elements = {};
	Object.defineProperty(elements, "tableOfTargetsBody", {
		value: {
			innerHTMLValue: "",
			set innerHTML(value) {
				writes.push(["html", value]);
				this.innerHTMLValue = value;
			},
			get innerHTML() {
				return this.innerHTMLValue;
			},
		},
	});
	Object.defineProperty(elements, "numberOfAisTargets", {
		value: {
			textContentValue: "",
			set textContent(value) {
				writes.push(["count", value]);
				this.textContentValue = value;
			},
			get textContent() {
				return this.textContentValue;
			},
		},
	});
	const document = {
		getElementById(id) {
			return elements[id];
		},
	};
	const config = {
		document,
		targets: new Map([
			[
				"235900001",
				{
					mmsi: "235900001",
					name: "NORTH CHANNEL",
					isValid: true,
					rangeFormatted: "1.00 NM",
				},
			],
		]),
		selfMmsi: "235008635",
		sortBy: "range",
		targetSilence: {
			updateGlobalSilenceControls() {},
		},
		getTargetSvgFn: () => "<svg></svg>",
	};

	updateTargetTableView(config);
	updateTargetTableView(config);

	assert.equal(writes.filter(([name]) => name === "html").length, 1);
	assert.equal(writes.filter(([name]) => name === "count").length, 1);
});

test("updateTargetTableView skips unchanged table render work", () => {
	const elements = {
		tableOfTargetsBody: { innerHTML: "" },
		numberOfAisTargets: { textContent: "" },
	};
	const document = {
		getElementById(id) {
			return elements[id];
		},
	};
	let svgCalls = 0;
	let silenceControlUpdates = 0;
	const config = {
		document,
		targets: new Map([
			[
				"235900001",
				{
					mmsi: "235900001",
					name: "NORTH CHANNEL",
					isValid: true,
					rangeFormatted: "1.00 NM",
					typeId: 37,
				},
			],
		]),
		selfMmsi: "235008635",
		sortBy: "range",
		targetSilence: {
			updateGlobalSilenceControls() {
				silenceControlUpdates += 1;
			},
		},
		getTargetSvgFn: () => {
			svgCalls += 1;
			return "<svg></svg>";
		},
	};

	updateTargetTableView(config);
	updateTargetTableView(config);

	assert.equal(svgCalls, 1);
	assert.equal(silenceControlUpdates, 2);
});
