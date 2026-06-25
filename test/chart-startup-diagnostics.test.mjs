import assert from "node:assert/strict";
import test from "node:test";
import {
	CHART_CONTROL_DIAGNOSTIC_STEPS,
	CHART_STARTUP_DIAGNOSTIC_STEPS,
	chartMapNames,
	createChartStartupDiagnostics,
	DEFAULT_CHART_DIAGNOSTIC_KEY,
	DEFAULT_CHART_DIAGNOSTIC_LIMIT,
	recordChartDiagnostic,
	recordChartDiagnosticError,
} from "../src/web/assets/scripts/chart-startup-diagnostics.mjs";

test("chart startup diagnostics exposes default storage settings", () => {
	assert.equal(DEFAULT_CHART_DIAGNOSTIC_KEY, "aisPlusChartDiagnostics");
	assert.equal(DEFAULT_CHART_DIAGNOSTIC_LIMIT, 100);
	assert.equal(CHART_STARTUP_DIAGNOSTIC_STEPS.start, "chart-startup:start");
	assert.equal(CHART_STARTUP_DIAGNOSTIC_STEPS.error, "chart-startup:error");
	assert.equal(CHART_CONTROL_DIAGNOSTIC_STEPS.start, "chart-controls:start");
	assert.equal(CHART_CONTROL_DIAGNOSTIC_STEPS.error, "chart-controls:error");
});

test("chart startup diagnostics records bounded entries on the chosen sink", () => {
	const sink = {};
	let tick = 0;
	const diagnostics = createChartStartupDiagnostics({
		sink,
		limit: 2,
		now: () => `t${++tick}`,
	});

	diagnostics.record("one", { value: 1 });
	recordChartDiagnostic(diagnostics, "two", { value: 2 });
	recordChartDiagnostic(diagnostics, "three", { value: 3 });

	assert.equal(sink.aisPlusChartDiagnostics.entries.length, 2);
	assert.deepEqual(
		sink.aisPlusChartDiagnostics.entries.map((entry) => entry.step),
		["two", "three"],
	);
	assert.deepEqual(sink.aisPlusChartDiagnostics.last, {
		ts: "t3",
		step: "three",
		details: { value: 3 },
	});
});

test("chart startup diagnostics serializes errors without throwing", () => {
	const sink = {};
	const diagnostics = createChartStartupDiagnostics({
		sink,
		now: () => "now",
	});
	const error = new TypeError("broken chart layer");

	recordChartDiagnosticError(diagnostics, "chart-startup:error", error, {
		baseLayerName: "NaturalEarth (offline)",
	});

	assert.equal(sink.aisPlusChartDiagnostics.entries.length, 1);
	assert.equal(sink.aisPlusChartDiagnostics.entries[0].error.name, "TypeError");
	assert.equal(
		sink.aisPlusChartDiagnostics.entries[0].error.message,
		"broken chart layer",
	);
	assert.deepEqual(sink.aisPlusChartDiagnostics.entries[0].details, {
		baseLayerName: "NaturalEarth (offline)",
	});
});

test("chart startup diagnostics helpers are safe with missing dependencies", () => {
	assert.doesNotThrow(() => recordChartDiagnostic(null, "ignored"));
	assert.doesNotThrow(() =>
		recordChartDiagnosticError(
			{
				error() {
					throw new Error("diagnostics sink failed");
				},
			},
			"ignored",
			new Error("real error"),
		),
	);
	assert.deepEqual(chartMapNames({ A: {}, B: {} }), ["A", "B"]);
	assert.deepEqual(chartMapNames(null), []);
});
