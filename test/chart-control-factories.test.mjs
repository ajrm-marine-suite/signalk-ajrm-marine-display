import assert from "node:assert/strict";
import test from "node:test";
import {
	defaultChartControlFactories,
	resolveChartControlFactories,
} from "../src/web/assets/scripts/chart-control-factories.mjs";

test("defaultChartControlFactories exposes the established chart setup factories", () => {
	const defaults = defaultChartControlFactories();

	assert.equal(typeof defaults.createChartLayerController, "function");
	assert.equal(typeof defaults.createChartSelectorControl, "function");
	assert.equal(typeof defaults.createMapToolbarButtons, "function");
	assert.equal(typeof defaults.applyChartStartup, "function");
});

test("resolveChartControlFactories prefers supplied factories", () => {
	const customFactories = {
		createChartLayerController: () => "layer",
		createChartSelectorControl: () => "selector",
		createMapToolbarButtons: () => "toolbar",
		applyChartStartup: () => "startup",
	};

	assert.deepEqual(resolveChartControlFactories(customFactories), {
		createLayerController: customFactories.createChartLayerController,
		createSelector: customFactories.createChartSelectorControl,
		createToolbar: customFactories.createMapToolbarButtons,
		applyStartup: customFactories.applyChartStartup,
	});
});
