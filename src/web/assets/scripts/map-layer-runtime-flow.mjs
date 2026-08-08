/**
 * Coordinates control flow for map layer runtime in the AJRM Marine Display browser application.
 */

export function createMapLayerRuntime({ createMapLayers, L, protomapsL, pmtilesUrl }) {
	return createMapLayers({
		L,
		protomapsL,
		pmtilesUrl,
	});
}
