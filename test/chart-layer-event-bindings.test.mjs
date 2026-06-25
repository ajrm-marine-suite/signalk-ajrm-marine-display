import assert from "node:assert/strict";
import test from "node:test";
import { registerChartLayerEventBindings } from "../src/web/assets/scripts/chart-layer-event-bindings.mjs";

test("registerChartLayerEventBindings wires Leaflet layer events", () => {
	const listeners = {};
	const map = {
		on(type, handler) {
			listeners[type] = handler;
		},
	};
	const handlers = {
		handleBaseLayerChange: () => "base",
		handleOverlayAdd: () => "add",
		handleOverlayRemove: () => "remove",
	};

	registerChartLayerEventBindings({ map, ...handlers });

	assert.equal(listeners.baselayerchange, handlers.handleBaseLayerChange);
	assert.equal(listeners.overlayadd, handlers.handleOverlayAdd);
	assert.equal(listeners.overlayremove, handlers.handleOverlayRemove);
});
