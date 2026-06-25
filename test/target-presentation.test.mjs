import assert from "node:assert/strict";
import test from "node:test";

import { targetIconPresentation } from "../src/web/assets/scripts/target-presentation.mjs";

test("targetIconPresentation keeps normal other vessels black", () => {
	assert.deepEqual(
		targetIconPresentation({
			target: { mmsi: "235900001" },
			selectedVesselMmsi: "235900002",
		}),
		{ color: "black", isLarge: false },
	);
});

test("targetIconPresentation keeps selected and alert vessels prominent", () => {
	assert.deepEqual(
		targetIconPresentation({
			target: { mmsi: "235900001" },
			selectedVesselMmsi: "235900001",
		}),
		{ color: "blue", isLarge: true },
	);
	assert.deepEqual(
		targetIconPresentation({
			target: { mmsi: "235900001", alarmState: "danger" },
			selectedVesselMmsi: "235900002",
		}),
		{ color: "red", isLarge: true },
	);
	assert.deepEqual(
		targetIconPresentation({
			target: { mmsi: "235900001", alarmState: "warning" },
			selectedVesselMmsi: "235900002",
		}),
		{ color: "orange", isLarge: true },
	);
});
