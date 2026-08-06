import { SETTINGS_STORAGE_KEYS } from "./settings-storage-keys.mjs";

export const DEFAULT_CHART_CYCLE_SHORTCUT = "C";

export function normalizeChartCycleShortcut(value) {
	const shortcut = String(value ?? "")
		.trim()
		.slice(0, 1)
		.toUpperCase();
	return shortcut || DEFAULT_CHART_CYCLE_SHORTCUT;
}

export function chartDisplayName(chart) {
	return (
		chart?.name ||
		chart?.title ||
		chart?.description ||
		chart?.__autoChartId ||
		"Unnamed chart"
	);
}

export function chartCycleMessage(result) {
	if (result?.mode === "disabled") return "Auto Charts is switched off";
	if (result?.mode === "empty") return "No enabled chart covers the map centre";
	if (result?.mode === "auto") {
		return `Automatic chart: ${chartDisplayName(result.chart)}`;
	}
	if (result?.mode === "manual") {
		return `Chart ${result.index} of ${result.total}: ${chartDisplayName(result.chart)}`;
	}
	return "Chart selection unavailable";
}

export function isEditableShortcutTarget(target) {
	const tagName = String(target?.tagName || "").toLowerCase();
	return (
		target?.isContentEditable === true ||
		tagName === "input" ||
		tagName === "textarea" ||
		tagName === "select"
	);
}

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
		storage?.getItem?.(SETTINGS_STORAGE_KEYS.chartCycleShortcut),
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
		showStatus(chartCycleMessage(result));
		return result;
	}

	function saveShortcut() {
		shortcut = normalizeChartCycleShortcut(shortcutInput?.value);
		if (shortcutInput) shortcutInput.value = shortcut;
		storage?.setItem?.(SETTINGS_STORAGE_KEYS.chartCycleShortcut, shortcut);
	}

	function keydownHandler(event) {
		if (
			event?.defaultPrevented ||
			event?.repeat ||
			event?.altKey ||
			event?.ctrlKey ||
			event?.metaKey ||
			isEditableShortcutTarget(event?.target) ||
			String(event?.key || "").length !== 1 ||
			normalizeChartCycleShortcut(event?.key) !== shortcut
		) {
			return;
		}
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
