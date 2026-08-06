import {
	CHART_CYCLE_SHORTCUT_STORAGE_KEY,
	chartCycleResultMessage,
	isChartCycleShortcutEvent,
	normalizeChartCycleShortcut,
} from "@ajrm-marine/map-core";

export { chartCycleResultMessage as chartCycleMessage, normalizeChartCycleShortcut };

export function createChartCycleControls({
	autoCharts,
	button,
	document = globalThis.document,
	shortcutInput,
	statusElement,
	storage = globalThis.localStorage,
	schedule = globalThis.setTimeout,
	cancelSchedule = globalThis.clearTimeout,
}) {
	let shortcut = normalizeChartCycleShortcut(
		storage?.getItem?.(CHART_CYCLE_SHORTCUT_STORAGE_KEY),
	);
	let hideTimer = null;

	function showStatus(message) {
		if (!statusElement) return;
		statusElement.textContent = message;
		statusElement.classList.remove("d-none");
		if (hideTimer != null) cancelSchedule?.(hideTimer);
		hideTimer = schedule?.(() => statusElement.classList.add("d-none"), 3500);
	}

	function cycle() {
		const result = autoCharts?.cycleChart?.() ?? null;
		showStatus(chartCycleResultMessage(result));
		return result;
	}

	function saveShortcut() {
		shortcut = normalizeChartCycleShortcut(shortcutInput?.value);
		if (shortcutInput) shortcutInput.value = shortcut;
		storage?.setItem?.(CHART_CYCLE_SHORTCUT_STORAGE_KEY, shortcut);
	}

	function keydownHandler(event) {
		if (!isChartCycleShortcutEvent(event, storage)) return;
		event.preventDefault?.();
		cycle();
	}

	function init() {
		if (shortcutInput) {
			shortcutInput.value = shortcut;
			shortcutInput.addEventListener("change", saveShortcut);
		}
		button?.addEventListener("click", cycle);
		document?.addEventListener?.("keydown", keydownHandler);
	}

	return {
		cycle,
		init,
		keydownHandler,
		saveShortcut,
		showStatus,
		get shortcut() {
			return shortcut;
		},
	};
}
