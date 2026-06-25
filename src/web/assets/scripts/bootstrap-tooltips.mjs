import * as bootstrap from "bootstrap";

export function activateBootstrapTooltips({
	document,
	Tooltip = bootstrap.Tooltip,
	selector = '[data-bs-toggle="tooltip"]',
}) {
	const tooltipTriggerList = document.querySelectorAll(selector);
	return [...tooltipTriggerList].map((tooltipTriggerEl) =>
		tooltipForElement(tooltipTriggerEl, Tooltip),
	);
}

export function tooltipForElement(element, Tooltip) {
	if (typeof Tooltip.getOrCreateInstance === "function") {
		return Tooltip.getOrCreateInstance(element);
	}
	if (typeof Tooltip.getInstance === "function") {
		const existing = Tooltip.getInstance(element);
		if (existing) return existing;
	}
	return new Tooltip(element);
}
