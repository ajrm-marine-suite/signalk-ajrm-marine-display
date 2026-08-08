/**
 * Builds configuration for app target selection event binding in the AJRM Marine Display browser application.
 */

export const TARGET_SELECTION_CONTROL_IDS = {
	targetTableBody: "tableOfTargetsBody",
	closebyList: "listOfClosebyBoats",
};

export function targetSelectionElements(document) {
	return {
		targetTableBody: document.getElementById(
			TARGET_SELECTION_CONTROL_IDS.targetTableBody,
		),
		closebyList: document.getElementById(TARGET_SELECTION_CONTROL_IDS.closebyList),
	};
}
