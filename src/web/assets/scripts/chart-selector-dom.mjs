import {
	CHART_SELECTOR_BUTTON_CLASS,
	CHART_SELECTOR_BUTTON_LABEL,
	CHART_SELECTOR_CONTAINER_CLASS,
	CHART_SELECTOR_PANEL_CLASS,
} from "./chart-selector-dom-constants.mjs";
import { DISPLAY_CONTROL_ICONS } from "./display-control-icons.mjs";
import { renderPanel } from "./chart-selector-render.mjs";

export function configureChartSelectorButton(button) {
	button.type = "button";
	button.title = CHART_SELECTOR_BUTTON_LABEL;
	button.setAttribute("aria-label", CHART_SELECTOR_BUTTON_LABEL);
	button.setAttribute("aria-expanded", "false");
	button.innerHTML = DISPLAY_CONTROL_ICONS.layers;
	return button;
}

export function configureChartSelectorPanel({
	panel,
	baseMaps,
	overlayMaps,
	escapeHtml,
}) {
	panel.hidden = true;
	panel.innerHTML = renderPanel({ baseMaps, overlayMaps, escapeHtml });
	return panel;
}

export function createChartSelectorContainer(L) {
	return L.DomUtil.create("div", CHART_SELECTOR_CONTAINER_CLASS);
}

export function createChartSelectorButton({ L, container }) {
	const button = L.DomUtil.create(
		"button",
		CHART_SELECTOR_BUTTON_CLASS,
		container,
	);
	return configureChartSelectorButton(button);
}

export function createChartSelectorPanel({
	L,
	container,
	baseMaps,
	overlayMaps,
	escapeHtml,
}) {
	const panel = L.DomUtil.create("div", CHART_SELECTOR_PANEL_CLASS, container);
	return configureChartSelectorPanel({ panel, baseMaps, overlayMaps, escapeHtml });
}

export function attachChartSelectorContainerBehaviour({ L, container, panel }) {
	L.DomEvent.disableClickPropagation(container);
	L.DomEvent.disableScrollPropagation(container);
	container._ajrmMarineChartPanel = panel;
	return container;
}

export function createChartSelectorElements({
	L,
	baseMaps,
	overlayMaps,
	escapeHtml,
}) {
	const container = createChartSelectorContainer(L);
	const button = createChartSelectorButton({ L, container });
	const panel = createChartSelectorPanel({
		L,
		container,
		baseMaps,
		overlayMaps,
		escapeHtml,
	});
	attachChartSelectorContainerBehaviour({ L, container, panel });

	return { button, container, panel };
}
