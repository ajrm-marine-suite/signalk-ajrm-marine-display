import assert from "node:assert/strict";
import test from "node:test";
import {
	applyDeltaValue,
	applySnapshotToTarget,
	createTarget,
	normalizeAisClass,
} from "../src/shared/target-model.mjs";
import { targetIconCacheKey } from "../src/web/assets/scripts/target-icon-cache.mjs";
import { targetIconFor } from "../src/web/assets/scripts/target-icon-resolver.mjs";
import { getAircraftIcon } from "../src/web/assets/scripts/ais-special-icons.mjs";
import { getUnknownVesselIcon } from "../src/web/assets/scripts/ais-vessel-icons.mjs";

test("AIS class remains unknown until an explicit A or B value is received", () => {
	const target = createTarget("235900010");
	assert.equal(target.aisClass, null);
	assert.equal(normalizeAisClass("A"), "A");
	assert.equal(normalizeAisClass({ value: "B" }), "B");
	assert.equal(normalizeAisClass("Class A"), null);

	applySnapshotToTarget(target, {
		sensors: { ais: { class: { value: "B" } } },
	});
	assert.equal(target.aisClass, "B");

	applySnapshotToTarget(target, {});
	assert.equal(target.aisClass, null);
});

test("explicit null rate of turn clears target state and changes the icon cache key", () => {
	const target = createTarget("235900011");
	applyDeltaValue(target, {
		path: "navigation.rateOfTurn",
		value: 0.04,
		timestamp: new Date().toISOString(),
	});
	const turningKey = targetIconCacheKey({ target });
	assert.equal(target.rot, 0.04);

	applyDeltaValue(target, {
		path: "navigation.rateOfTurn",
		value: null,
		timestamp: new Date().toISOString(),
	});
	const clearedKey = targetIconCacheKey({ target });
	assert.equal(target.rot, undefined);
	assert.notEqual(clearedKey, turningKey);
});

test("unknown-class turn arrow rotates with vessel heading while the question mark stays upright", () => {
	const previousLeaflet = globalThis.L;
	globalThis.L = {
		divIcon(options) {
			return { options };
		},
	};

	try {
		const icon = getUnknownVesselIcon(
			{ hdg: Math.PI / 2, rot: 0.01 },
			false,
			"black",
		);

		assert.match(
			icon.options.html,
			/transform="rotate\(90 25 25\)">\s*<g class="ajrm-marine-rotation-arrow"/,
		);
		assert.doesNotMatch(
			icon.options.html,
			/<g[^>]*transform="rotate\(90 25 25\)"[^>]*>[\s\S]*>\?<\/text>/,
		);
	} finally {
		if (previousLeaflet === undefined) {
			delete globalThis.L;
		} else {
			globalThis.L = previousLeaflet;
		}
	}
});

test("SAR aircraft map icon is a simple aircraft aligned with its heading", () => {
	const previousLeaflet = globalThis.L;
	globalThis.L = {
		divIcon(options) {
			return { options };
		},
	};

	try {
		const icon = getAircraftIcon({ hdg: Math.PI / 2 }, false, "#123456");
		assert.match(icon.options.html, /class="ajrm-marine-sar-aircraft"/);
		assert.match(icon.options.html, /transform="rotate\(90 25 25\)"/);
		assert.match(icon.options.html, /fill="#123456"/);
	} finally {
		if (previousLeaflet === undefined) delete globalThis.L;
		else globalThis.L = previousLeaflet;
	}
});

test("target icon resolver uses only explicit A and B classes", () => {
	const calls = [];
	const aisIcons = {
		getSelfIcon: () => "self",
		getAircraftIcon: () => "aircraft",
		getSartIcon: () => "sart",
		getAtonIcon: () => "aton",
		getClassAIcon: () => {
			calls.push("A");
			return "A";
		},
		getClassBIcon: () => {
			calls.push("B");
			return "B";
		},
		getBaseIcon: () => "base",
		getUnknownVesselIcon: () => {
			calls.push("unknown");
			return "unknown";
		},
	};
	const base = {
		aisIcons,
		selfMmsi: "235000000",
		isLarge: false,
		color: "black",
	};

	assert.equal(
		targetIconFor({
			...base,
			target: { mmsi: "111000599", targetKind: "sar-aircraft" },
		}),
		"aircraft",
	);
	assert.equal(
		targetIconFor({
			...base,
			target: { mmsi: "235900012", aisClass: "A" },
		}),
		"A",
	);
	assert.equal(
		targetIconFor({
			...base,
			target: { mmsi: "235900013", aisClass: "B" },
		}),
		"B",
	);
	assert.equal(
		targetIconFor({
			...base,
			target: { mmsi: "235900014", aisClass: null },
		}),
		"unknown",
	);
	assert.deepEqual(calls, ["A", "B", "unknown"]);
});

test("self icon scale is passed only to the own-vessel icon", () => {
	const calls = [];
	const aisIcons = {
		getSelfIcon: (...args) => {
			calls.push(["self", ...args]);
			return "self";
		},
		getAircraftIcon: () => "aircraft",
		getSartIcon: () => "sart",
		getAtonIcon: () => "aton",
		getClassAIcon: (...args) => {
			calls.push(["A", ...args]);
			return "A";
		},
		getClassBIcon: () => "B",
		getBaseIcon: () => "base",
		getUnknownVesselIcon: () => "unknown",
	};

	targetIconFor({
		aisIcons,
		target: { mmsi: "self" },
		selfMmsi: "self",
		selfIconScalePercent: 55,
		selfIconOrientation: "cog",
	});
	targetIconFor({
		aisIcons,
		target: { mmsi: "235900015", aisClass: "A" },
		selfMmsi: "self",
		selfIconScalePercent: 55,
	});

	assert.equal(calls[0][0], "self");
	assert.equal(calls[0][4], 55);
	assert.equal(calls[0][5], "cog");
	assert.equal(calls[1][0], "A");
	assert.equal(calls[1].length, 4);
});

test("own-vessel icon orientation changes only the self icon cache key", () => {
	const selfTarget = { mmsi: "self", hdg: 0, cog: Math.PI / 2 };
	const otherTarget = { mmsi: "235900016", hdg: 0, cog: Math.PI / 2 };

	assert.notEqual(
		targetIconCacheKey({
			target: selfTarget,
			selfMmsi: "self",
			selfIconOrientation: "heading",
		}),
		targetIconCacheKey({
			target: selfTarget,
			selfMmsi: "self",
			selfIconOrientation: "cog",
		}),
	);
	assert.equal(
		targetIconCacheKey({
			target: otherTarget,
			selfMmsi: "self",
			selfIconOrientation: "heading",
		}),
		targetIconCacheKey({
			target: otherTarget,
			selfMmsi: "self",
			selfIconOrientation: "cog",
		}),
	);
});
