export const CHART_BASEMAP_INPUT_NAME = "ajrm-marine-basemap";
export const CHART_OVERLAY_INPUT_NAME = "ajrm-marine-overlay";

export function chartSelectorInputQuery(inputName) {
	return `input[name="${inputName}"]`;
}
