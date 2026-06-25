import assert from "node:assert/strict";
import test from "node:test";
import {
	chooseAutoChartForMap,
	createAutoChartList,
} from "../src/web/assets/scripts/auto-chart-selection.mjs";

test("createAutoChartList keeps Signal K chart ids on each chart", () => {
	assert.deepEqual(
		createAutoChartList({
			coarse: { name: "Coarse", bounds: [-6, 52, -2, 56] },
			detail: { name: "Detail", bounds: [-5, 53, -3, 55] },
		}),
		[
			{
				__autoChartId: "coarse",
				name: "Coarse",
				bounds: [-6, 52, -2, 56],
			},
			{
				__autoChartId: "detail",
				name: "Detail",
				bounds: [-5, 53, -3, 55],
			},
		],
	);
	assert.deepEqual(createAutoChartList(null), []);
});

test("chooseAutoChartForMap uses current map zoom, max zoom and position", () => {
	const chartList = createAutoChartList({
		coarse: {
			bounds: [-6, 52, -2, 56],
			minzoom: 7,
			maxzoom: 9,
		},
		detail: {
			bounds: [-5, 53, -3, 55],
			minzoom: 11,
			maxzoom: 12,
		},
	});

	const selected = chooseAutoChartForMap({
		chartList,
		map: {
			getZoom: () => 11,
			getMaxZoom: () => 22,
		},
		getPosition: () => ({ lat: 54, lng: -4 }),
	});

	assert.equal(selected.__autoChartId, "detail");
	assert.equal(
		chooseAutoChartForMap({
			chartList,
			map: {
				getZoom: () => 11,
				getMaxZoom: () => 22,
			},
			getPosition: () => ({ lat: 60, lng: -4 }),
		}),
		null,
	);
});
