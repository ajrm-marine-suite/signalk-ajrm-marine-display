import * as basemaps from "@protomaps/basemaps";

export function createProtomapsRules(protomapsL) {
	const paintRules = protomapsL.paintRules({
		...basemaps.namedFlavor("light"),
		water: "rgba(0,0,0,0)",
	});
	const labelRules = protomapsL.labelRules(basemaps.namedFlavor("light"));
	return { paintRules, labelRules };
}
