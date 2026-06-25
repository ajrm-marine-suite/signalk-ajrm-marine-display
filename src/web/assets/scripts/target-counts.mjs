import { countText } from "./target-counts-state.mjs";

export function renderTargetCounts({
	totalElement,
	filteredElement,
	alarmElement,
	total,
	filtered,
	alarms,
}) {
	setTextContentIfChanged(totalElement, countText(total));
	setTextContentIfChanged(filteredElement, countText(filtered));
	setTextContentIfChanged(alarmElement, countText(alarms));
}

export function setTextContentIfChanged(element, value) {
	const text = String(value);
	if (element.textContent === text) return false;
	element.textContent = text;
	return true;
}
