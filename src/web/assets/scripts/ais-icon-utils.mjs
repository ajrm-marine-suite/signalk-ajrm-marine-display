export function createAisDivIcon({ html, boxSize }) {
	return L.divIcon({
		className: "foobar",
		html,
		iconAnchor: [boxSize / 2, boxSize / 2],
	});
}
