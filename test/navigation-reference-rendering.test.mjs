import assert from "node:assert/strict";
import test from "node:test";
import { getSelfIcon } from "../src/web/assets/scripts/ais-special-icons.mjs";
import {
	getClassAIcon,
	getClassBIcon,
} from "../src/web/assets/scripts/ais-vessel-icons.mjs";
import {
	setProjectedCourseLine,
	setSelectedCourseLine,
} from "../src/web/assets/scripts/course-lines.mjs";
import { updateSelfTcpaGuideLines } from "../src/web/assets/scripts/self-tcpa-guide-lines.mjs";
import { updateTargetCourseLine } from "../src/web/assets/scripts/target-course-line-update.mjs";

globalThis.L = {
	divIcon(options) {
		return { options };
	},
};

test("valid zero-radian heading outranks eastbound COG in vessel icons", () => {
	const target = { hdg: 0, cog: Math.PI / 2 };
	for (const icon of [
		getSelfIcon(target, "triangle"),
		getClassAIcon(target, false, "black"),
		getClassBIcon(target, false, "black"),
	]) {
		assert.match(icon.options.html, /rotate\(0 /);
		assert.doesNotMatch(icon.options.html, /rotate\(90 /);
	}
});

test("own-vessel icon direction can explicitly use heading or COG", () => {
	const target = { hdg: 0, cog: Math.PI / 2 };
	const headingIcon = getSelfIcon(
		target,
		"triangle",
		"#ff00ff",
		100,
		"heading",
	);
	const cogIcon = getSelfIcon(
		target,
		"triangle",
		"#ff00ff",
		100,
		"cog",
	);

	assert.match(headingIcon.options.html, /rotate\(0 /);
	assert.match(cogIcon.options.html, /rotate\(90 /);
});

test("heading-oriented own icon explicitly falls back to COG when heading is unavailable", () => {
	const icon = getSelfIcon(
		{ cog: Math.PI / 2 },
		"triangle",
		"#ff00ff",
		100,
		"heading",
	);

	assert.match(icon.options.html, /rotate\(90 /);
});

test("heading-oriented own icon rejects a non-finite heading and falls back to COG", () => {
	const icon = getSelfIcon(
		{ hdg: Number.NaN, cog: Math.PI / 2 },
		"triangle",
		"#ff00ff",
		100,
		"heading",
	);

	assert.match(icon.options.html, /rotate\(90 /);
});

test("COG-oriented own icon becomes neutral when COG is unavailable", () => {
	const icon = getSelfIcon(
		{ hdg: Math.PI / 2 },
		"triangle",
		"#ff00ff",
		100,
		"cog",
	);

	assert.doesNotMatch(icon.options.html, /rotate\(/);
	assert.match(icon.options.html, /<circle/);
});

test("heading-oriented own icon becomes neutral when heading and COG are unavailable", () => {
	const icon = getSelfIcon(
		{},
		"boat",
		"#ff00ff",
		100,
		"heading",
	);

	assert.doesNotMatch(icon.options.html, /rotate\(/);
	assert.match(icon.options.html, /<circle/);
});

test("stale own-vessel icon keeps its last direction and uses grey styling", () => {
	const icon = getSelfIcon(
		{
			isStale: true,
			lastKnownHdg: Math.PI / 2,
		},
		"boat",
		"#ff00ff",
		100,
		"heading",
	);

	assert.match(icon.options.html, /rotate\(90 /);
	assert.match(icon.options.html, /fill="#9ca3af"/);
	assert.match(icon.options.html, /stroke="#6b7280"/);
	assert.match(icon.options.html, /stroke="#dc2626"/);
	assert.doesNotMatch(icon.options.html, /fill="#ff00ff"/);
});

test("own-vessel icon scaling changes only its requested pixel size", () => {
	const compactRings = getSelfIcon({}, "rings", "#ff00ff", 50);
	const defaultRings = getSelfIcon({}, "rings", "#ff00ff", 100);
	const compactBoat = getSelfIcon({}, "boat", "#ff00ff", 50);

	assert.match(compactRings.options.html, /width="20px"/);
	assert.match(defaultRings.options.html, /width="40px"/);
	assert.match(compactBoat.options.html, /width="30px"/);
	assert.deepEqual(compactRings.options.iconAnchor, [10, 10]);
	assert.deepEqual(defaultRings.options.iconAnchor, [20, 20]);
});

test("course lines are cleared instead of projecting false north without COG", () => {
	const line = lineStub();
	const cpaMarker = {
		removed: false,
		removeFrom() {
			this.removed = true;
		},
	};
	const map = {
		hasLayer() {
			return false;
		},
	};

	assert.equal(
		setSelectedCourseLine({
			line,
			start: [56, -5],
			cog: undefined,
			distance: 100,
			cpaMarker,
			map,
		}),
		false,
	);
	assert.deepEqual(line.latLngs, []);
	assert.equal(cpaMarker.removed, true);

	line._ajrmMarineCourseLineState = { kind: "projected" };
	assert.equal(
		setProjectedCourseLine({
			line,
			start: [56, -5],
			cog: undefined,
			distance: 100,
			color: "black",
		}),
		false,
	);
	assert.deepEqual(line.latLngs, []);
});

test("self TCPA guides stay hidden while COG is unavailable", () => {
	const guide = lineStub();
	const line = {
		_ajrmMarineSelfTcpaGuideLines: [{ line: guide }],
	};
	const handled = updateSelfTcpaGuideLines({
		line,
		target: {
			isValid: true,
			latitude: 56,
			longitude: -5,
			sog: 2,
			cog: undefined,
		},
		map: {},
		L: {},
		collisionProfiles: {
			current: "coastal",
			coastal: {},
		},
		settings: {
			mode: "tcpa",
		},
	});

	assert.equal(handled, true);
	assert.deepEqual(guide.latLngs, []);
});

test("own-vessel projected track always receives COG rather than heading", () => {
	let projected = null;
	updateTargetCourseLine({
		target: {
			mmsi: "self",
			latitude: 56,
			longitude: -5,
			sog: 2,
			cog: Math.PI / 2,
			hdg: 0,
		},
		selfMmsi: "self",
		selectedVesselMmsi: null,
		targets: new Map(),
		line: lineStub(),
		blueCircle1: {},
		blueCircle2: {},
		map: {},
		L: {},
		collisionProfiles: { current: "coastal" },
		courseProjectionMinutes: 5,
		vesselIcon: { color: "black" },
		setProjectedCourseLineFn(value) {
			projected = value;
		},
		updateSelfTcpaGuideLinesFn() {
			return false;
		},
		hideSelfTcpaGuideLinesFn() {},
	});

	assert.equal(projected.cog, Math.PI / 2);
	assert.notEqual(projected.cog, 0);
});

test("selecting own vessel preserves its normal projected track", () => {
	let projected = null;
	let selected = null;
	updateTargetCourseLine({
		target: {
			mmsi: "self",
			latitude: 56,
			longitude: -5,
			sog: 2,
			cog: Math.PI / 2,
		},
		selfMmsi: "self",
		selectedVesselMmsi: "self",
		targets: new Map([["self", { mmsi: "self" }]]),
		line: lineStub(),
		blueCircle1: {},
		blueCircle2: {},
		map: {},
		L: {},
		collisionProfiles: { current: "coastal" },
		courseProjectionMinutes: 5,
		vesselIcon: { color: "black" },
		setSelectedCourseLineFn(value) {
			selected = value;
		},
		setProjectedCourseLineFn(value) {
			projected = value;
		},
		updateSelfTcpaGuideLinesFn() {
			return false;
		},
		hideSelfTcpaGuideLinesFn() {},
	});

	assert.equal(selected, null);
	assert.equal(projected.distance, 600);
});

function lineStub() {
	return {
		_ajrmMarineCourseLineState: { kind: "old" },
		latLngs: null,
		setLatLngs(value) {
			this.latLngs = value;
		},
		setStyle() {},
	};
}
