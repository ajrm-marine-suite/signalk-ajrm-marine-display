/**
 * Binds events for app target selection in the AJRM Marine Display browser application.
 */

import { targetSelectionElements } from "./app-target-selection-event-binding-config.mjs";

export function registerTargetSelectionEventBindings({
	map,
	document,
	selectTableSort,
	targetSelection,
	setSortTableBy,
}) {
	const elements = targetSelectionElements(document);
	elements.targetTableBody.addEventListener(
		"click",
		targetSelection.handleTableOfTargetsBodyClick,
	);
	elements.closebyList.addEventListener(
		"click",
		targetSelection.handleListOfClosebyBoatsClick,
	);
	selectTableSort.addEventListener("input", (ev) => {
		setSortTableBy(ev.target.value);
	});
	map.on("click", targetSelection.handleMapClick);
}
