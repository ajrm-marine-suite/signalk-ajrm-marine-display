import { DISPLAY_CONTROL_ICONS } from "./display-control-icons.mjs";

export function toggleOffcanvas(instance, element) {
	if (!instance) return;
	if (element?.classList?.contains("show") || element?.classList?.contains("showing")) instance.hide();
	else instance.show();
}

export function mapToolbarButtonSpecs({
	offcanvas,
	document = globalThis.document,
}) {
	return [
		{
			icon: DISPLAY_CONTROL_ICONS.cycleCharts,
			title: "Cycle chart",
			action: () => document.getElementById("buttonCycleChart")?.click(),
		},
		{
			icon: DISPLAY_CONTROL_ICONS.targets,
			title: "AIS Targets",
			action: () => toggleOffcanvas(offcanvas.targetList, document.getElementById("offcanvasTargetList")),
		},
		{
			icon: DISPLAY_CONTROL_ICONS.profiles,
			title: "Profiles",
			action: () => toggleOffcanvas(offcanvas.profiles, document.getElementById("offcanvasProfiles")),
		},
		{
			icon: DISPLAY_CONTROL_ICONS.settings,
			title: "Settings",
			action: () => toggleOffcanvas(offcanvas.settings, document.getElementById("offcanvasSettings")),
		},
		{
			icon: DISPLAY_CONTROL_ICONS.routes,
			title: "Routes",
			action: () => document.getElementById("buttonOpenRoutes")?.click(),
		},
		{
			icon: DISPLAY_CONTROL_ICONS.observation,
			title: "Voyage observation",
			action: () => document.getElementById("buttonOpenObservation")?.click(),
		},
		{
			icon: DISPLAY_CONTROL_ICONS.help,
			title: "Help",
			action: () => document.getElementById("buttonOpenHelp")?.click(),
		},
	];
}

export function createMapToolbarButtons({
	map,
	easyButton,
	offcanvas,
	document = globalThis.document,
}) {
	const buttons = mapToolbarButtonSpecs({ offcanvas, document }).map((spec) =>
		easyButton(spec.icon, spec.action, spec.title).addTo(map),
	);

	return { buttons };
}
