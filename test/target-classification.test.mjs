import assert from "node:assert/strict";
import test from "node:test";

import {
	aisSpecialSafetyMmsiType,
	classifyAisTarget,
	targetKindLabel,
} from "../src/shared/target-classification.mjs";
import { getTargetSvg } from "../src/web/assets/scripts/target-svg-selector.mjs";

test("ITU 111MIDXXX MMSIs identify visible non-collision SAR aircraft", () => {
	const classification = classifyAisTarget({ mmsi: "111232534" });
	assert.deepEqual(classification, {
		targetKind: "sar-aircraft",
		targetKindDetail: "helicopter",
		collisionCandidate: false,
	});
	assert.equal(targetKindLabel({ mmsi: "111000599" }), "SAR aircraft (helicopter)");
	assert.match(getTargetSvg({ mmsi: "111000599", targetKind: "sar-aircraft" }), /viewBox="0 0 50 50"/);
});

test("ordinary-MMSI hovercraft remain collision candidates", () => {
	const target = {
		mmsi: "235900099",
		name: "RESCUE HOVERCRAFT",
		type: "aircraft-like hovercraft",
		typeId: 60,
	};
	assert.deepEqual(classifyAisTarget(target), {
		targetKind: "vessel",
		targetKindDetail: null,
		collisionCandidate: true,
	});
	assert.equal(targetKindLabel(target), "Vessel");
});

test("special safety MMSI detection requires an exact nine-digit allocation", () => {
	assert.equal(aisSpecialSafetyMmsiType("111000599"), "sar-aircraft");
	assert.equal(aisSpecialSafetyMmsiType("111"), null);
	assert.equal(aisSpecialSafetyMmsiType("1112325340"), null);
});
