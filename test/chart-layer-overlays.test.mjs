import assert from "node:assert/strict";
import test from "node:test";
import { createOverlayMaps } from "../src/web/assets/scripts/chart-control-overlays.mjs";
import {
	AUTO_CHARTS_OVERLAY_NAME,
	HARBOUR_LIMITS_OVERLAY_NAME,
	OPEN_SEA_MAP_OVERLAY_NAME,
	isAutoChartsOverlay,
	isHarbourLimitsOverlay,
	isOpenSeaMapOverlay,
} from "../src/web/assets/scripts/chart-layer-overlay-actions.mjs";

test("chart overlay names stay stable for Leaflet layer control storage", () => {
	assert.equal(OPEN_SEA_MAP_OVERLAY_NAME, "OpenSeaMap");
	assert.equal(AUTO_CHARTS_OVERLAY_NAME, "Auto Charts");
	assert.equal(HARBOUR_LIMITS_OVERLAY_NAME, "Harbour Limits");
	assert.equal(isOpenSeaMapOverlay("OpenSeaMap"), true);
	assert.equal(isAutoChartsOverlay("Auto Charts"), true);
	assert.equal(isHarbourLimitsOverlay("Harbour Limits"), true);
});

test("createOverlayMaps preserves OpenSeaMap above Auto Charts by name", () => {
	const openSeaMap = { name: "seamarks" };
	const autoCharts = { group: { name: "charts" } };
	const harbourDisplay = { layer: { name: "harbours" } };

	assert.deepEqual(createOverlayMaps({ openSeaMap, autoCharts, harbourDisplay }), {
		OpenSeaMap: openSeaMap,
		"Auto Charts": autoCharts.group,
		"Harbour Limits": harbourDisplay.layer,
	});
});
