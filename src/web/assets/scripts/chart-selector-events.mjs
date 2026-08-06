import {
	handlePanelChange,
	hidePanel,
	togglePanel,
} from "./chart-selector-panel.mjs";
import { fitChartSelectorPanel } from "./chart-selector-dom.mjs";

export function chartSelectorEventHandlers({
	L,
	button,
	panel,
	onSelectBaseLayer,
	onSetOverlayLayer,
	chartFolderGroups,
	windowObject = globalThis.window,
}) {
	return {
		buttonClick(event) {
			togglePanel({ L, button, panel, event });
			if (!panel.hidden) {
				fitChartSelectorPanel(panel, windowObject);
				void chartFolderGroups?.refresh?.(panel);
			}
		},
		panelChange(event) {
			handlePanelChange({
				event,
				onSelectBaseLayer,
				onSetOverlayLayer,
				onSetChartFolder: (folderPath, enabled) =>
					chartFolderGroups?.setEnabled?.({ panel, folderPath, enabled }),
			});
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
	chartFolderGroups,
	windowObject = globalThis.window,
}) {
	const handlers = chartSelectorEventHandlers({
		L,
		button,
		panel,
		onSelectBaseLayer,
		onSetOverlayLayer,
		chartFolderGroups,
		windowObject,
	});
	L.DomEvent.on(button, "click", handlers.buttonClick);
	L.DomEvent.on(panel, "change", handlers.panelChange);
	L.DomEvent.on(map, "click", handlers.mapClick);
	windowObject?.addEventListener?.("resize", () => {
		if (!panel.hidden) fitChartSelectorPanel(panel, windowObject);
	});
}
