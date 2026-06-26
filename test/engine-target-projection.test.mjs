import assert from "node:assert/strict";
import test from "node:test";
import { applyEngineTargetProjection } from "../src/web/assets/scripts/engine-target-projection.mjs";

test("Traffic Core projection overlays authoritative fields onto standard Signal K targets", () => {
	const target = {
		mmsi: "235000001",
		name: "Standard name",
		latitude: 56.2,
		longitude: -5.5,
	};
	const targets = new Map([["235000001", target]]);
	const applied = applyEngineTargetProjection({
		targets,
		projection: {
			235000001: {
				mmsi: "235000001",
				alarmState: "danger",
				cpa: 40,
				cpaFormatted: "40 m",
				tcpa: 180,
			},
		},
	});
	assert.equal(applied, 1);
	assert.equal(target.alarmState, "danger");
	assert.equal(target.cpa, 40);
	assert.equal(target.name, "Standard name");
});

test("Traffic Core projection preserves database-filled vessel dimensions when absent", () => {
	const target = {
		mmsi: "235900005",
		name: "HARBOUR TUG",
		length: 18.5,
		beam: 5.2,
		sizeFormatted: "18.5 m x 5.2 m",
		vesselFootprintSourceFormatted: "Vessel database",
	};
	const targets = new Map([["235900005", target]]);
	const applied = applyEngineTargetProjection({
		targets,
		projection: {
			235900005: {
				mmsi: "235900005",
				alarmState: "warning",
				length: undefined,
				beam: undefined,
				sizeFormatted: "--- m x --- m",
			},
		},
	});

	assert.equal(applied, 1);
	assert.equal(target.alarmState, "warning");
	assert.equal(target.length, 18.5);
	assert.equal(target.beam, 5.2);
	assert.equal(target.sizeFormatted, "18.5 m x 5.2 m");
	assert.equal(target.vesselFootprintSourceFormatted, "Vessel database");
});
