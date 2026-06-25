import {
	CHART_BASEMAP_INPUT_NAME,
	CHART_OVERLAY_INPUT_NAME,
	chartSelectorInputQuery,
} from "./chart-selector-inputs.mjs";

export function togglePanel({ L, button, panel, event }) {
	L.DomEvent.stop(event);
	setPanelExpanded({ button, panel, expanded: panel.hidden });
}

export function hidePanel({ button, panel }) {
	setPanelExpanded({ button, panel, expanded: false });
}

export function setPanelExpanded({ button, panel, expanded }) {
	panel.hidden = !expanded;
	button.setAttribute("aria-expanded", String(expanded));
}

export function baseMapInputAction(input) {
	return { type: "base", value: input.value };
}

export function overlayInputAction(input) {
	return { type: "overlay", value: input.value, checked: input.checked };
}

export function chartSelectorInputAction(input) {
	if (input.name === CHART_BASEMAP_INPUT_NAME) {
		return baseMapInputAction(input);
	}
	if (input.name === CHART_OVERLAY_INPUT_NAME) {
		return overlayInputAction(input);
	}
	return null;
}

export function isChartSelectorInput(input) {
	return input instanceof HTMLInputElement;
}

export function applyChartSelectorInputAction({
	action,
	onSelectBaseLayer,
	onSetOverlayLayer,
}) {
	if (action?.type === "base") {
		onSelectBaseLayer(action.value);
		return true;
	}
	if (action?.type === "overlay") {
		onSetOverlayLayer(action.value, action.checked);
		return true;
	}
	return false;
}

export function handlePanelChange({ event, onSelectBaseLayer, onSetOverlayLayer }) {
	const input = event.target;
	if (!isChartSelectorInput(input)) return;
	applyChartSelectorInputAction({
		action: chartSelectorInputAction(input),
		onSelectBaseLayer,
		onSetOverlayLayer,
	});
}

export function updateCheckedInputs({ panel, inputName, isChecked }) {
	for (const input of panel.querySelectorAll(chartSelectorInputQuery(inputName))) {
		input.checked = isChecked(input.value);
	}
}

export function updateBaseLayerInputs(panel, getBaseLayerName) {
	updateCheckedInputs({
		panel,
		inputName: CHART_BASEMAP_INPUT_NAME,
		isChecked: (value) => getBaseLayerName() === value,
	});
}

export function updateOverlayInputs(panel, isOverlayEnabled) {
	updateCheckedInputs({
		panel,
		inputName: CHART_OVERLAY_INPUT_NAME,
		isChecked: isOverlayEnabled,
	});
}
