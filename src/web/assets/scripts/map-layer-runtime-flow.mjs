export function createMapLayerRuntime({ createMapLayers, L, protomapsL, pmtilesUrl }) {
	return createMapLayers({
		L,
		protomapsL,
		pmtilesUrl,
	});
}
