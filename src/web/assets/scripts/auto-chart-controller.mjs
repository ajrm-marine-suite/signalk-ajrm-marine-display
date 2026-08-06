import {
	createAutoChartControllerParts,
	ensureAutoChartGroupVisible,
	shouldUpdateAutoChartLayer,
} from "./auto-chart-controller-helpers.mjs";
import { resetAutoChartFallback } from "./auto-chart-layer-state.mjs";
import {
	chartCandidatesForMap,
	createAutoChartList,
} from "./auto-chart-selection.mjs";
import { applyAutoChartToggle } from "./auto-chart-toggle-flow.mjs";
import { updateAutoChartLayer } from "./auto-chart-update-flow.mjs";
import { keepChartLayersOnTop } from "./chart-layer-ordering.mjs";
import { chartContains } from "./chart-resource-utils.mjs";
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
	let manualChartId = null;
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
		const selected = selectedChart();
		updateAutoChartLayer({
			group,
			keepOnTop,
			makeChartLayer,
			selected,
			state: layerState,
		});
	}

	function selectedChart() {
		if (!manualChartId) return chooseChart();
		const position = getPosition();
		const selected = chartList.find(
			(chart) => chart.__autoChartId === manualChartId,
		);
		if (selected && chartContains(selected, position.lat, position.lng)) {
			return selected;
		}
		manualChartId = null;
		return chooseChart();
	}

	function cycleChart() {
		if (!enabled) return { mode: "disabled", chart: null, index: 0, total: 0 };
		const candidates = chartCandidatesForMap({ chartList, map, getPosition });
		if (candidates.length === 0) {
			manualChartId = null;
			update();
			return { mode: "empty", chart: null, index: 0, total: 0 };
		}

		if (!manualChartId) {
			const nextIndex = candidates.length === 1 ? 0 : 1;
			const chart = candidates[nextIndex];
			manualChartId = chart.__autoChartId;
			update();
			return {
				mode: "manual",
				chart,
				index: nextIndex + 1,
				total: candidates.length,
			};
		}

		const currentIndex = candidates.findIndex(
			(chart) => chart.__autoChartId === manualChartId,
		);
		if (currentIndex < 0 || currentIndex >= candidates.length - 1) {
			manualChartId = null;
			update();
			return {
				mode: "auto",
				chart: candidates[0],
				index: 1,
				total: candidates.length,
			};
		}

		const nextIndex = currentIndex + 1;
		const chart = candidates[nextIndex];
		manualChartId = chart.__autoChartId;
		update();
		return {
			mode: "manual",
			chart,
			index: nextIndex + 1,
			total: candidates.length,
		};
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
		if (!chartList.some((chart) => chart.__autoChartId === manualChartId)) {
			manualChartId = null;
		}
		layerState.chartId = null;
		return true;
	}

	async function toggle(nextEnabled) {
		if (!nextEnabled) manualChartId = null;
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
		cycleChart,
		ensureVisible,
		keepOnTop,
		refreshCharts,
		resetFallback,
		toggle,
		update,
		get enabled() {
			return enabled;
		},
		get manualChartId() {
			return manualChartId;
		},
	};
}

function autoChartListsMatch(current, next) {
	return JSON.stringify(current) === JSON.stringify(next);
}
