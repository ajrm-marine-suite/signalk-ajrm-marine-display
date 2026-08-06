import {
	CHART_BASEMAP_INPUT_NAME,
	CHART_OVERLAY_INPUT_NAME,
} from "./chart-selector-inputs.mjs";
import { AUTO_CHARTS_OVERLAY_NAME } from "./chart-layer-overlay-actions.mjs";

export function escapeAttribute(value, escapeHtml) {
	return escapeHtml(value).replace(/`/g, "&#96;");
}

export function renderOption(inputName, inputType, value, escapeHtml) {
	return `
				<label class="ajrm-marine-chart-selector-option">
					<input type="${inputType}" name="${inputName}" value="${escapeAttribute(value, escapeHtml)}" />
					<span>${escapeHtml(value)}</span>
				</label>
			`;
}

export function renderOptions({ names, inputName, inputType, escapeHtml }) {
	return names
		.map((name) => renderOption(inputName, inputType, name, escapeHtml))
		.join("");
}

export function renderBaseMapOptions({ baseMaps, escapeHtml }) {
	return renderOptions({
		names: Object.keys(baseMaps),
		inputName: CHART_BASEMAP_INPUT_NAME,
		inputType: "radio",
		escapeHtml,
	});
}

export function renderOverlayOptions({ overlayMaps, escapeHtml }) {
	return renderOptions({
		names: Object.keys(overlayMaps).filter(
			(name) => name !== AUTO_CHARTS_OVERLAY_NAME,
		),
		inputName: CHART_OVERLAY_INPUT_NAME,
		inputType: "checkbox",
		escapeHtml,
	});
}

export function renderAutoChartsOption({ overlayMaps, escapeHtml }) {
	if (!(AUTO_CHARTS_OVERLAY_NAME in overlayMaps)) return "";
	return `${renderOption(
		CHART_OVERLAY_INPUT_NAME,
		"checkbox",
		AUTO_CHARTS_OVERLAY_NAME,
		escapeHtml,
	)}
		<details class="ajrm-marine-chart-folder-groups" data-chart-folder-groups hidden>
			<summary>Chart folders</summary>
			<div class="ajrm-marine-chart-folder-body" data-chart-folder-body></div>
		</details>`;
}

export function renderPanel({ baseMaps, overlayMaps, escapeHtml }) {
	const baseOptions = renderBaseMapOptions({ baseMaps, escapeHtml });
	const overlayOptions = renderOverlayOptions({ overlayMaps, escapeHtml });
	const autoChartsOption = renderAutoChartsOption({ overlayMaps, escapeHtml });
	return `
		<div class="ajrm-marine-chart-selector-title">Basemap</div>
		${baseOptions}
		<div class="ajrm-marine-chart-selector-title">Overlays</div>
		${overlayOptions}
		${autoChartsOption}
	`;
}
