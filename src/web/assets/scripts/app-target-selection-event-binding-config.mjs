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
