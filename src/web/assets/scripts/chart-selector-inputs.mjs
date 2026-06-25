export const CHART_BASEMAP_INPUT_NAME = "ais-plus-basemap";
export const CHART_OVERLAY_INPUT_NAME = "ais-plus-overlay";

export function chartSelectorInputQuery(inputName) {
	return `input[name="${inputName}"]`;
}
