import {
	CHART_BASEMAP_INPUT_NAME,
	CHART_OVERLAY_INPUT_NAME,
} from "./chart-selector-inputs.mjs";

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
		names: Object.keys(overlayMaps),
		inputName: CHART_OVERLAY_INPUT_NAME,
		inputType: "checkbox",
		escapeHtml,
	});
}

export function renderPanel({ baseMaps, overlayMaps, escapeHtml }) {
	const baseOptions = renderBaseMapOptions({ baseMaps, escapeHtml });
	const overlayOptions = renderOverlayOptions({ overlayMaps, escapeHtml });
	return `
		<div class="ajrm-marine-chart-selector-title">Basemap</div>
		${baseOptions}
		<div class="ajrm-marine-chart-selector-title">Overlays</div>
		${overlayOptions}
	`;
}
