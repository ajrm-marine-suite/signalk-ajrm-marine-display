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
	if (tableBody._aisPlusRenderKey === renderKey) {
		targetSilence.updateGlobalSilenceControls();
		return;
	}

	const { html, rowCount } = renderTargetTable({
		targets,
		selfMmsi,
		sortBy,
		getTargetSvg: getTargetSvgFn,
	});
	if (tableBody._aisPlusRenderedHtml !== html) {
		tableBody.innerHTML = html;
		tableBody._aisPlusRenderedHtml = html;
	}
	if (targetCount._aisPlusRenderedCount !== rowCount) {
		targetCount.textContent = rowCount;
		targetCount._aisPlusRenderedCount = rowCount;
	}
	tableBody._aisPlusRenderKey = renderKey;
	targetSilence.updateGlobalSilenceControls();
}
