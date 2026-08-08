/**
 * Provides utility operations for AIS icon in the AJRM Marine Display browser application.
 */

export function createAisDivIcon({ html, boxSize }) {
	return L.divIcon({
		className: "foobar",
		html,
		iconAnchor: [boxSize / 2, boxSize / 2],
	});
}
