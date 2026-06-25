export const REQUIRED_LEAFLET_LAYER_METHODS = ["addTo", "remove"];

export function isLeafletLayer(layer) {
	return !!(
		layer &&
		typeof layer === "object" &&
		REQUIRED_LEAFLET_LAYER_METHODS.every(
			(methodName) => typeof layer[methodName] === "function",
		)
	);
}
