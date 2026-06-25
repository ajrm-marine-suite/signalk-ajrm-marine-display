import {
	handlePanelChange,
	hidePanel,
	togglePanel,
} from "./chart-selector-panel.mjs";

export function chartSelectorEventHandlers({
	L,
	button,
	panel,
	onSelectBaseLayer,
	onSetOverlayLayer,
}) {
	return {
		buttonClick(event) {
			togglePanel({ L, button, panel, event });
		},
		panelChange(event) {
			handlePanelChange({ event, onSelectBaseLayer, onSetOverlayLayer });
		},
		mapClick() {
			hidePanel({ button, panel });
		},
	};
}

export function bindChartSelectorEvents({
	L,
	map,
	button,
	panel,
	onSelectBaseLayer,
	onSetOverlayLayer,
}) {
	const handlers = chartSelectorEventHandlers({
		L,
		button,
		panel,
		onSelectBaseLayer,
		onSetOverlayLayer,
	});
	L.DomEvent.on(button, "click", handlers.buttonClick);
	L.DomEvent.on(panel, "change", handlers.panelChange);
	L.DomEvent.on(map, "click", handlers.mapClick);
}
