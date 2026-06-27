import { renderTargetTable, targetTableRenderKey } from "./target-table.mjs";
import { getTargetSvg } from "./target-svg-selector.mjs";

export function updateTargetTableView({
	document,
	targets,
	selfMmsi,
	sortBy,
	targetSilence,
	getTargetSvgFn = getTargetSvg,
}) {
	const tableBody = document.getElementById("tableOfTargetsBody");
	const targetCount = document.getElementById("numberOfAisTargets");
	const renderKey = targetTableRenderKey({ targets, selfMmsi, sortBy });
	if (tableBody._ajrmMarineRenderKey === renderKey) {
		targetSilence.updateGlobalSilenceControls();
		return;
	}

	const { html, rowCount } = renderTargetTable({
		targets,
		selfMmsi,
		sortBy,
		getTargetSvg: getTargetSvgFn,
	});
	if (tableBody._ajrmMarineRenderedHtml !== html) {
		tableBody.innerHTML = html;
		tableBody._ajrmMarineRenderedHtml = html;
	}
	if (targetCount._ajrmMarineRenderedCount !== rowCount) {
		targetCount.textContent = rowCount;
		targetCount._ajrmMarineRenderedCount = rowCount;
	}
	tableBody._ajrmMarineRenderKey = renderKey;
	targetSilence.updateGlobalSilenceControls();
}
