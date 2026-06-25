import {
	selectChartBaseLayer,
	setChartOverlayLayer,
} from "./chart-layer-controller-actions.mjs";
import { createChartLayerEventHandlers } from "./chart-layer-event-handlers.mjs";

export function createChartLayerController({
	map,
	baseMaps,
	overlayMaps,
	autoCharts,
	displaySettings,
	harbourDisplay,
	storage = globalThis.localStorage,
}) {
	let chartSelectorControl;
	const { handleBaseLayerChange, handleOverlayAdd, handleOverlayRemove } =
		createChartLayerEventHandlers({
			autoCharts,
			displaySettings,
			harbourDisplay,
			storage,
		});

	function updateChartSelectorControl() {
		chartSelectorControl?.update();
	}

	function selectBaseLayer(name) {
		selectChartBaseLayer({
			map,
			baseMaps,
			name,
			handleBaseLayerChange,
			updateChartSelectorControl,
		});
	}

	function setOverlayLayer(name, enabled) {
		setChartOverlayLayer({
			map,
			overlayMaps,
			autoCharts,
			name,
			enabled,
			handleOverlayAdd,
			handleOverlayRemove,
			updateChartSelectorControl,
		});
	}

	return {
		setChartSelectorControl(control) {
			chartSelectorControl = control;
		},
		selectBaseLayer,
		setOverlayLayer,
		updateChartSelectorControl,
		handleBaseLayerChange,
		handleOverlayAdd,
		handleOverlayRemove,
	};
}
