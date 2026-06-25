export function activeBaseLayers({ map, baseMaps }) {
	return Object.values(baseMaps || {}).filter((layer) => map.hasLayer(layer));
}

export function removeActiveBaseLayers({ map, baseMaps }) {
	for (const layer of activeBaseLayers({ map, baseMaps })) map.removeLayer(layer);
}
