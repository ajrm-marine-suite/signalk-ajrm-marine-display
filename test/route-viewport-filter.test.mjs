import assert from "node:assert/strict";
import test from "node:test";
import {
	filterRoutesForBounds,
	routeCrossesBounds,
} from "../src/web/assets/scripts/route-viewport-filter.mjs";

const bounds = { west: -5.2, south: 55.9, east: -4.8, north: 56.1 };
const route = (coordinates) => ({ spatial: { coordinates } });

test("route viewport filter includes starts, ends and intermediate waypoints in view", () => {
	assert.equal(routeCrossesBounds(route([[-5, 56], [-4, 57]]), bounds), true);
	assert.equal(routeCrossesBounds(route([[-6, 55], [-5, 56], [-4, 57]]), bounds), true);
	assert.equal(routeCrossesBounds(route([[-6, 55], [-5, 56]]), bounds), true);
});

test("route viewport filter includes a crossing leg with both endpoints outside", () => {
	assert.equal(routeCrossesBounds(route([[-6, 56], [-4, 56]]), bounds), true);
	assert.equal(routeCrossesBounds(route([[-6, 55], [-5.8, 55.2]]), bounds), false);
});

test("route viewport filtering is optional and handles missing summaries", () => {
	const routes = [route([[-6, 56], [-4, 56]]), route([[-6, 55], [-5.8, 55.2]]), {}];
	assert.equal(filterRoutesForBounds(routes, bounds, false).length, 3);
	assert.equal(filterRoutesForBounds(routes, bounds, true).length, 1);
});

test("route viewport filter handles short route legs crossing the date line", () => {
	const dateLineBounds = { west: 178, south: -1, east: -178, north: 1 };
	assert.equal(routeCrossesBounds(route([[177, 0], [-177, 0]]), dateLineBounds), true);
	assert.equal(routeCrossesBounds(route([[-10, 0], [10, 0]]), dateLineBounds), false);
});
