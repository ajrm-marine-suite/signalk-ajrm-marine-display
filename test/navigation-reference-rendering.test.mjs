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
