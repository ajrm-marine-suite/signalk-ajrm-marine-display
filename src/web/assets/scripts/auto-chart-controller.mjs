import {
	ensureAutoChartGroupVisible,
	createAutoChartControllerParts,
	shouldUpdateAutoChartLayer,
} from "./auto-chart-controller-helpers.mjs";
import { resetAutoChartFallback } from "./auto-chart-layer-state.mjs";
import { createAutoChartList } from "./auto-chart-selection.mjs";
import { applyAutoChartToggle } from "./auto-chart-toggle-flow.mjs";
import { updateAutoChartLayer } from "./auto-chart-update-flow.mjs";
import { keepChartLayersOnTop } from "./chart-layer-ordering.mjs";
import { SETTINGS_STORAGE_KEYS } from "./settings-storage-keys.mjs";

export function createAutoChartController({
	L,
	protomapsL,
	map,
	charts,
	paintRules,
	labelRules,
	openSeaMap,
	getPosition,
	loadCharts,
	storage = globalThis.localStorage,
}) {
	let enabled = true;
	const chartList = createAutoChartList(charts);
	const { chooseChart, group, layerState, makeChartLayer } =
		createAutoChartControllerParts({
			L,
			chartList,
			getPosition,
			labelRules,
			map,
			paintRules,
			protomapsL,
		});

	function keepOnTop() {
		keepChartLayersOnTop({ group, map, openSeaMap });
	}

	function ensureVisible() {
		ensureAutoChartGroupVisible({ enabled, group, map });
	}

	function update() {
		ensureVisible();
		if (!shouldUpdateAutoChartLayer({ group, map })) return;
		const selected = chooseChart();
		updateAutoChartLayer({
			group,
			keepOnTop,
			makeChartLayer,
			selected,
			state: layerState,
		});
	}

	function resetFallback() {
		resetAutoChartFallback(layerState);
	}

	async function refreshCharts() {
		if (typeof loadCharts !== "function") return false;
		let refreshedCharts;
		try {
			refreshedCharts = await loadCharts();
		} catch {
			return false;
		}
		const nextChartList = createAutoChartList(refreshedCharts);
		if (autoChartListsMatch(chartList, nextChartList)) return false;
		chartList.splice(0, chartList.length, ...nextChartList);
		layerState.chartId = null;
		return true;
	}

	async function toggle(nextEnabled) {
		enabled = applyAutoChartToggle({
			ensureVisible,
			group,
			map,
			nextEnabled,
			state: layerState,
			storage,
			storageKey: SETTINGS_STORAGE_KEYS.autoCharts,
			update,
		});
	}

	return {
		group,
		ensureVisible,
		keepOnTop,
		refreshCharts,
		resetFallback,
		toggle,
		update,
		get enabled() {
			return enabled;
		},
	};
}

function autoChartListsMatch(current, next) {
	return JSON.stringify(current) === JSON.stringify(next);
}
