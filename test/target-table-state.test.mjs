import assert from "node:assert/strict";
import test from "node:test";
import {
	compareTargetRows,
	targetSortNumber,
	targetTableRowClass,
} from "../src/web/assets/scripts/target-table-state.mjs";

test("targetSortNumber places missing numeric values last", () => {
	assert.equal(targetSortNumber(1.2), 1.2);
	assert.equal(targetSortNumber(undefined), Infinity);
	assert.equal(targetSortNumber(NaN), Infinity);
});

test("targetTableRowClass maps visual alarm state to Bootstrap rows", () => {
	assert.equal(targetTableRowClass({ alarmState: "danger" }), "table-danger");
	assert.equal(targetTableRowClass({ alarmState: "warning" }), "table-warning");
	assert.equal(targetTableRowClass({ alarmState: "" }), "");
});

test("compareTargetRows sorts missing CPA and TCPA values after finite values", () => {
	assert.equal(compareTargetRows({ cpa: 1 }, { cpa: undefined }, "cpa"), -Infinity);
	assert.equal(
		compareTargetRows({ tcpa: undefined }, { tcpa: 12 }, "tcpa"),
		Infinity,
	);
});

test("compareTargetRows sorts by name and fallback display order", () => {
	assert.equal(compareTargetRows({ name: "Bravo" }, { name: "Alpha" }, "name"), 1);
	assert.equal(compareTargetRows({ order: 2 }, { order: 5 }, "alarm"), -3);
});
