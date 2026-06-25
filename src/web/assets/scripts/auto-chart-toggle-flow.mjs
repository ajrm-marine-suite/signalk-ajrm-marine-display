import { clearAutoChartLayer } from "./auto-chart-layer-state.mjs";

export function applyAutoChartToggle({
	ensureVisible,
	group,
	map,
	nextEnabled,
	state,
	storage,
	storageKey,
	update,
}) {
	storage.setItem(storageKey, String(nextEnabled));
	if (nextEnabled) {
		ensureVisible();
		update();
		return true;
	}
	clearAutoChartLayer({ group, state });
	if (map.hasLayer(group)) group.removeFrom(map);
	return false;
}
