import assert from "node:assert/strict";
import test from "node:test";
import { createMapFollowController } from "../src/web/assets/scripts/map-follow-control.mjs";

function fakeEasyButtonFactory() {
	const buttons = [];
	return {
		buttons,
		easyButton(icon, action) {
			const button = {
				icon,
				action,
				button: {
					innerHTML: "",
					title: "",
				},
				addTo(map) {
					this.map = map;
					buttons.push(this);
					return this;
				},
			};
			return button;
		},
	};
}

function setup({ selfTarget } = {}) {
	const easyButtons = fakeEasyButtonFactory();
	const map = {
		pans: [],
		panTo(position, options) {
			this.pans.push({ position, options });
		},
	};
	const autoCharts = {
		updates: 0,
		update() {
			this.updates += 1;
		},
	};
	const disableMoveendValues = [];
	const controller = createMapFollowController({
		easyButton: easyButtons.easyButton,
		map,
		autoCharts,
		getSelfTarget: () => selfTarget,
		setDisableMoveend: (value) => {
			disableMoveendValues.push(value);
		},
	});
	return { autoCharts, controller, disableMoveendValues, easyButtons, map };
}

test("map follow control starts in following state and can show paused state", () => {
	const { easyButtons, controller } = setup();
	const button = easyButtons.buttons[0].button;

	assert.equal(controller.getMapFollowSelf(), true);
	assert.equal(button.title, "Following own vessel");
	assert.match(button.innerHTML, /ajrm-marine-control-icon/);
	assert.match(button.innerHTML, /Follow own vessel/);

	controller.setMapFollowSelf(false);

	assert.equal(controller.getMapFollowSelf(), false);
	assert.equal(button.title, "Follow paused. Click to centre own vessel");
	assert.match(button.innerHTML, /ajrm-marine-control-icon/);
	assert.match(button.innerHTML, /Paused/);
});

test("clicking follow recentres on valid own vessel and refreshes auto charts", () => {
	const { autoCharts, controller, disableMoveendValues, easyButtons, map } = setup({
		selfTarget: { isValid: true, latitude: 53.75, longitude: -4.7 },
	});
	controller.setMapFollowSelf(false);

	easyButtons.buttons[0].action(null, map);

	assert.equal(controller.getMapFollowSelf(), true);
	assert.deepEqual(disableMoveendValues, [true, false]);
	assert.deepEqual(map.pans, [
		{ position: [53.75, -4.7], options: { animate: false } },
	]);
	assert.equal(autoCharts.updates, 1);
});

test("clicking follow does nothing when own vessel position is invalid", () => {
	const { autoCharts, disableMoveendValues, easyButtons, map } = setup({
		selfTarget: { isValid: false, latitude: 53.75, longitude: -4.7 },
	});

	easyButtons.buttons[0].action(null, map);

	assert.deepEqual(disableMoveendValues, []);
	assert.deepEqual(map.pans, []);
	assert.equal(autoCharts.updates, 0);
});
