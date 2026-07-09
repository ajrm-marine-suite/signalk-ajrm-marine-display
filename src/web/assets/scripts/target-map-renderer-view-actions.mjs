import { updateTargetTableView } from "./target-table-view.mjs";

export function updateRendererTargetTable({
	document,
	targets,
	selfMmsi,
	sortBy,
	targetSilence,
	updateTableView = updateTargetTableView,
}) {
	return updateTableView({
		document,
		targets,
		selfMmsi,
		sortBy,
		targetSilence,
	});
}

export function drawRendererRangeRings({ rangeRings, selfTarget, enabled = true }) {
	if (!enabled) return rangeRings.clear?.() ?? false;
	return rangeRings.draw(selfTarget);
}

export async function updateRendererHarbourDisplay({
	harbourDisplay,
	enabled,
}) {
	return harbourDisplay.update({ enabled });
}
