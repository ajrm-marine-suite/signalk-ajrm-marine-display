import assert from "node:assert/strict";
import test from "node:test";
import {
	DEFAULT_BASE_LAYER,
	fallbackBaseLayerName,
	hasNamedLayer,
	resolveChartStartupState,
	restoredOverlayName,
} from "../src/web/assets/scripts/chart-startup-state.mjs";

const baseMaps = {
	Empty: {},
	OpenStreetMap: {},
	"NaturalEarth (offline)": {},
};
const overlayMaps = {
	OpenSeaMap: {},
	"Auto Charts": {},
};

test("hasNamedLayer only matches explicit non-empty layer names", () => {
	assert.equal(hasNamedLayer(baseMaps, "Empty"), true);
	assert.equal(hasNamedLayer(baseMaps, "Missing"), false);
	assert.equal(hasNamedLayer(baseMaps, ""), false);
	assert.equal(hasNamedLayer(null, "Empty"), false);
});

test("fallbackBaseLayerName prefers NaturalEarth then the first available layer", () => {
	assert.equal(DEFAULT_BASE_LAYER, "NaturalEarth (offline)");
	assert.equal(
		fallbackBaseLayerName({ baseMaps }),
		"NaturalEarth (offline)",
	);
	assert.equal(
		fallbackBaseLayerName({ baseMaps: { Empty: {}, OpenSeaMap: {} } }),
		"Empty",
	);
	assert.equal(fallbackBaseLayerName({ baseMaps: {} }), "");
});

test("restoredOverlayName restores only stored normal overlays", () => {
	assert.equal(restoredOverlayName({ overlayMaps, storedOverlay: "OpenSeaMap" }), "OpenSeaMap");
	assert.equal(restoredOverlayName({ overlayMaps, storedOverlay: "Auto Charts" }), "");
	assert.equal(restoredOverlayName({ overlayMaps, storedOverlay: "Missing" }), "");
	assert.equal(restoredOverlayName({ overlayMaps, storedOverlay: null }), "");
});

test("resolveChartStartupState restores a valid stored basemap and overlay", () => {
	assert.deepEqual(
		resolveChartStartupState({
			storedBaseLayer: "Empty",
			storedOverlay: "OpenSeaMap",
			storedAutoCharts: "true",
			baseMaps,
			overlayMaps,
		}),
		{
			baseLayerName: "Empty",
			overlayName: "OpenSeaMap",
			autoChartsEnabled: true,
		},
	);
});

test("resolveChartStartupState defaults invalid basemaps to NaturalEarth", () => {
	assert.equal(
		resolveChartStartupState({
			storedBaseLayer: "Missing",
			baseMaps,
			overlayMaps,
		}).baseLayerName,
		"NaturalEarth (offline)",
	);
});

test("resolveChartStartupState avoids OpenStreetMap by default", () => {
	assert.equal(
		resolveChartStartupState({
			storedBaseLayer: "OpenStreetMap",
			baseMaps,
			overlayMaps,
		}).baseLayerName,
		"NaturalEarth (offline)",
	);
});

test("resolveChartStartupState disables Auto Charts only for explicit false", () => {
	assert.equal(
		resolveChartStartupState({
			storedAutoCharts: "false",
			baseMaps,
			overlayMaps,
		}).autoChartsEnabled,
		false,
	);
	assert.equal(
		resolveChartStartupState({
			storedAutoCharts: null,
			baseMaps,
			overlayMaps,
		}).autoChartsEnabled,
		true,
	);
});

test("resolveChartStartupState does not restore Auto Charts as a normal overlay", () => {
	assert.equal(
		resolveChartStartupState({
			storedOverlay: "Auto Charts",
			baseMaps,
			overlayMaps,
		}).overlayName,
		"",
	);
});
