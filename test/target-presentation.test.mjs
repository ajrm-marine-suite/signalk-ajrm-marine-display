import assert from "node:assert/strict";
import test from "node:test";

import {
	targetIconPresentation,
	targetTooltipHtml,
	targetTooltipSignature,
} from "../src/web/assets/scripts/target-presentation.mjs";

test("targetIconPresentation keeps normal other vessels black", () => {
	assert.deepEqual(
		targetIconPresentation({
			target: { mmsi: "235900001" },
			selectedVesselMmsi: "235900002",
		}),
		{ color: "black", isLarge: false },
	);
});

test("stale own-vessel tooltip identifies a last fix rather than a current position", () => {
	const target = {
		name: "Example Yacht",
		isLost: true,
		sogFormatted: "---",
		cpaFormatted: "---",
		tcpaFormatted: "---",
	};
	assert.match(targetTooltipHtml(target), /LAST FIX — NO GPS/);
	assert.match(targetTooltipSignature(target), /last-fix/);
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
