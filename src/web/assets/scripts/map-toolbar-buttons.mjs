import { DISPLAY_CONTROL_ICONS } from "./display-control-icons.mjs";

export function mapToolbarButtonSpecs({ offcanvas, document = globalThis.document }) {
	return [
		{
			icon: DISPLAY_CONTROL_ICONS.targets,
			title: "AIS Targets",
			action: () => offcanvas.targetList.show(),
		},
		{
			icon: DISPLAY_CONTROL_ICONS.profiles,
			title: "Profiles",
			action: () => offcanvas.profiles.show(),
		},
		{
			icon: DISPLAY_CONTROL_ICONS.settings,
			title: "Settings",
			action: () => offcanvas.settings.show(),
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
