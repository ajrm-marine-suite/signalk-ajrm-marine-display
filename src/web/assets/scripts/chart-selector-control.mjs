import { createChartSelectorElements } from "./chart-selector-dom.mjs";
import { bindChartSelectorEvents } from "./chart-selector-events.mjs";
import { updateChartSelectorPanel } from "./chart-selector-update.mjs";

export {
	applyChartSelectorInputAction,
	baseMapInputAction,
	chartSelectorInputAction,
	handlePanelChange,
	hidePanel,
	isChartSelectorInput,
	overlayInputAction,
	setPanelExpanded,
	togglePanel,
	updateBaseLayerInputs,
	updateCheckedInputs,
	updateOverlayInputs,
} from "./chart-selector-panel.mjs";
export {
	CHART_BASEMAP_INPUT_NAME,
	CHART_OVERLAY_INPUT_NAME,
	chartSelectorInputQuery,
} from "./chart-selector-inputs.mjs";
export {
	escapeAttribute,
	renderBaseMapOptions,
	renderOptions,
	renderOverlayOptions,
	renderOption,
	renderPanel,
} from "./chart-selector-render.mjs";
export {
	attachChartSelectorContainerBehaviour,
	configureChartSelectorButton,
	configureChartSelectorPanel,
	createChartSelectorButton,
	createChartSelectorContainer,
	createChartSelectorElements,
	createChartSelectorPanel,
} from "./chart-selector-dom.mjs";
export {
	CHART_SELECTOR_BUTTON_CLASS,
	CHART_SELECTOR_BUTTON_LABEL,
	CHART_SELECTOR_CONTAINER_CLASS,
	CHART_SELECTOR_PANEL_CLASS,
} from "./chart-selector-dom-constants.mjs";
export {
	bindChartSelectorEvents,
	chartSelectorEventHandlers,
} from "./chart-selector-events.mjs";
export {
	chartSelectorPanelForControl,
	updateChartSelectorPanel,
} from "./chart-selector-update.mjs";

export function chartSelectorControlDefinition({
	L,
	map,
	baseMaps,
	overlayMaps,
	onSelectBaseLayer,
	onSetOverlayLayer,
	escapeHtml,
}) {
	return {
		options: { position: "topleft" },
		onAdd() {
			const { button, container, panel } = createChartSelectorElements({
				L,
				baseMaps,
				overlayMaps,
				escapeHtml,
			});
			bindChartSelectorEvents({
				L,
				map,
				button,
				panel,
				onSelectBaseLayer,
				onSetOverlayLayer,
			});
			return container;
		},
	};
}

export function chartSelectorControlDefinitionConfig({
	L,
	map,
	baseMaps,
	overlayMaps,
	onSelectBaseLayer,
	onSetOverlayLayer,
	escapeHtml,
}) {
	return {
		L,
		map,
		baseMaps,
		overlayMaps,
		onSelectBaseLayer,
		onSetOverlayLayer,
		escapeHtml,
	};
}

export function chartSelectorControlApi({
	control,
	getBaseLayerName,
	isOverlayEnabled,
}) {
	return {
		control,
		update() {
			updateChartSelectorPanel({
				control,
				getBaseLayerName,
				isOverlayEnabled,
			});
		},
	};
}

export function chartSelectorControlApiConfig({
	control,
	getBaseLayerName,
	isOverlayEnabled,
}) {
	return {
		control,
		getBaseLayerName,
		isOverlayEnabled,
	};
}

export function createLeafletChartSelectorControl({
	L,
	map,
	baseMaps,
	overlayMaps,
	onSelectBaseLayer,
	onSetOverlayLayer,
	escapeHtml,
}) {
	const ChartSelectorControl = L.Control.extend(
		chartSelectorControlDefinition(
			chartSelectorControlDefinitionConfig({
				L,
				map,
				baseMaps,
				overlayMaps,
				onSelectBaseLayer,
				onSetOverlayLayer,
				escapeHtml,
			}),
		),
	);

	return new ChartSelectorControl();
}

export function createChartSelectorControl({
	L,
	map,
	baseMaps,
	overlayMaps,
	getBaseLayerName,
	isOverlayEnabled,
	onSelectBaseLayer,
	onSetOverlayLayer,
	escapeHtml,
}) {
	const control = createLeafletChartSelectorControl({
		L,
		map,
		baseMaps,
		overlayMaps,
		onSelectBaseLayer,
		onSetOverlayLayer,
		escapeHtml,
	});

	return chartSelectorControlApi(
		chartSelectorControlApiConfig({
			control,
			getBaseLayerName,
			isOverlayEnabled,
		}),
	);
}
