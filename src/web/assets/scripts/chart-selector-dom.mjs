/**
 * Implements the chart selector DOM responsibilities of the AJRM Marine Display browser application.
 */

import {
	CHART_SELECTOR_BUTTON_CLASS,
	CHART_SELECTOR_BUTTON_LABEL,
	CHART_SELECTOR_CONTAINER_CLASS,
	CHART_SELECTOR_PANEL_CLASS,
} from "./chart-selector-dom-constants.mjs";
import { setMapControlHoverHelp } from "@ajrm-marine/map-core";
import { DISPLAY_CONTROL_ICONS } from "./display-control-icons.mjs";
import { renderPanel } from "./chart-selector-render.mjs";

export function configureChartSelectorButton(button) {
	button.type = "button";
	setMapControlHoverHelp(button, "Choose maps and charts");
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

export function chartSelectorPanelHeight({
	top = 0,
	viewportHeight = 0,
	bottomGap = 12,
	maximum = 560,
	minimum = 48,
} = {}) {
	const available = Number(viewportHeight) - Number(top) - Number(bottomGap);
	return Math.max(minimum, Math.min(maximum, Number.isFinite(available) ? available : maximum));
}

export function fitChartSelectorPanel(panel, windowObject = globalThis.window) {
	if (!panel) return null;
	const top = panel.getBoundingClientRect?.().top ?? 0;
	const height = chartSelectorPanelHeight({ top, viewportHeight: windowObject?.innerHeight });
	if (panel.style) panel.style.maxHeight = `${Math.floor(height)}px`;
	return height;
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
