import assert from "node:assert/strict";
import test from "node:test";
import {
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
				__ajrmMapChartId: "coarse",
				__autoChartId: "coarse",
				name: "Coarse",
				bounds: [-6, 52, -2, 56],
			},
			{
				__ajrmMapChartId: "detail",
				__autoChartId: "detail",
				name: "Detail",
				bounds: [-5, 53, -3, 55],
			},
		],
	);
	assert.deepEqual(createAutoChartList(null), []);
});

test("createAutoChartList caches normalized geometry and zoom metadata", () => {
	const [chart] = createAutoChartList({
		Cuan: {
			bounds: [-5.7, 56.1, -5.5, 56.3],
			minzoom: "13",
			maxzoom: "18",
		},
	});
	assert.deepEqual(chart.__ajrmMapBounds, [
		[-5.7, 56.1, -5.5, 56.3],
		[56.1, -5.7, 56.3, -5.5],
	]);
	assert.deepEqual(chart.__ajrmMapZoom, { min: 13, max: 18 });
});
