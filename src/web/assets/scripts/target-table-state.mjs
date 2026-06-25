export function targetSortNumber(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : Infinity;
}

export function targetTableRowClass(target) {
	if (target.alarmState === "danger") return "table-danger";
	if (target.alarmState === "warning") return "table-warning";
	return "";
}

export function compareTargetRows(a, b, sortBy) {
	if (sortBy === "tcpa") return targetSortNumber(a.tcpa) - targetSortNumber(b.tcpa);
	if (sortBy === "cpa") return targetSortNumber(a.cpa) - targetSortNumber(b.cpa);
	if (sortBy === "range") return targetSortNumber(a.range) - targetSortNumber(b.range);
	if (sortBy === "name") return a.name > b.name ? 1 : -1;
	return a.order - b.order;
}
