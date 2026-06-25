import {
	ensureLayerAdded,
	ensureLayerRemoved,
	isAutoChartsOverlay,
	removeActiveBaseLayers,
} from "./chart-layer-actions.mjs";

export function namedLayer(layers, name) {
	return layers?.[name] || null;
}

export function applySelectedBaseLayer({ map, baseMaps, selectedLayer }) {
	removeActiveBaseLayers({ map, baseMaps });
	selectedLayer.addTo(map);
}

export function selectChartBaseLayer({
	map,
	baseMaps,
	name,
	handleBaseLayerChange,
	updateChartSelectorControl,
}) {
	const selectedLayer = namedLayer(baseMaps, name);
	if (!selectedLayer) return;
	applySelectedBaseLayer({ map, baseMaps, selectedLayer });
	handleBaseLayerChange({ name });
	updateChartSelectorControl();
}

export function applySelectedNormalOverlay({
	map,
	selectedLayer,
	name,
	enabled,
	handleOverlayAdd,
	handleOverlayRemove,
}) {
	if (enabled) {
		ensureLayerAdded({ map, layer: selectedLayer });
		handleOverlayAdd({ name });
	} else {
		ensureLayerRemoved({ map, layer: selectedLayer });
		handleOverlayRemove({ name });
	}
}

export function setChartOverlayLayer({
	map,
	overlayMaps,
	autoCharts,
	name,
	enabled,
	handleOverlayAdd,
	handleOverlayRemove,
	updateChartSelectorControl,
}) {
	const selectedLayer = namedLayer(overlayMaps, name);
	if (!selectedLayer) return;
	if (isAutoChartsOverlay(name)) {
		autoCharts.toggle(enabled);
	} else {
		applySelectedNormalOverlay({
			map,
			selectedLayer,
			name,
			enabled,
			handleOverlayAdd,
			handleOverlayRemove,
		});
	}
	updateChartSelectorControl();
}
