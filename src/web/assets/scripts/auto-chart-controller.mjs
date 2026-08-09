/**
 * Coordinates auto chart in the AJRM Marine Display browser application.
 */

import {
	createAutoChartControllerParts,
	ensureAutoChartGroupVisible,
	shouldUpdateAutoChartLayer,
} from "./auto-chart-controller-helpers.mjs";
import { chartId, createChartCycleState } from "@ajrm-marine/map-core";
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
	const enabledListeners = new Set();
	const chartList = createAutoChartList(charts);
	const chartCycle = createChartCycleState();
	const { group, layerState, makeChartLayer } =
		createAutoChartControllerParts({
			L,
			labelRules,
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
		return chartCycle.choose(chartList, map, getPosition());
	}

	function cycleChart() {
		if (!enabled) return { mode: "disabled", chart: null, index: 0, total: 0 };
		const position = getPosition();
		const candidates = chartCycle.getCandidates(chartList, map, position);
		if (candidates.length === 0) {
			chartCycle.reset();
			update();
			return { mode: "empty", chart: null, index: 0, total: 0 };
		}
		const chart = chartCycle.cycle(chartList, map, position);
		update();
		const manualChartId = chartCycle.manualChartId;
		const index = manualChartId
			? candidates.findIndex((candidate) => chartId(candidate) === manualChartId) + 1
			: 1;
		return {
			mode: manualChartId ? "manual" : "auto",
			chart,
			index,
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
		if (!chartList.some((chart) => chartId(chart) === chartCycle.manualChartId)) {
			chartCycle.reset();
		}
		layerState.chartId = null;
		return true;
	}

	async function toggle(nextEnabled) {
		if (!nextEnabled) chartCycle.reset();
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
		for (const listener of enabledListeners) listener(enabled);
	}

	return {
		group,
		cycleChart,
		ensureVisible,
		keepOnTop,
		onEnabledChange(listener) {
			enabledListeners.add(listener);
			listener(enabled);
			return () => enabledListeners.delete(listener);
		},
		refreshCharts,
		resetFallback,
		toggle,
		update,
		get enabled() {
			return enabled;
		},
		get manualChartId() {
			return chartCycle.manualChartId;
		},
	};
}

function autoChartListsMatch(current, next) {
	return JSON.stringify(current) === JSON.stringify(next);
}
