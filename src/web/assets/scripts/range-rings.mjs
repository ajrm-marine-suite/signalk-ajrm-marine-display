import * as L from "leaflet";

export function createRangeRingsController({ map, metersPerNm, leaflet = L }) {
	const rangeRings = leaflet.layerGroup();
	let lastSignature = "";

	function draw(selfTarget) {
		if (!selfTarget?.isValid) return false;

		const bounds = map.getBounds();
		const mapHeightInNauticalMiles = 60 * Math.abs(
			bounds.getNorth() - bounds.getSouth(),
		);
		const step = rangeRingStep(mapHeightInNauticalMiles);
		const signature = rangeRingsSignature({ selfTarget, step, metersPerNm });
		if (signature === lastSignature) return false;

		rangeRings.removeFrom(map);
		rangeRings.clearLayers();

		for (let i = 1; i <= 6; i++) {
			rangeRings.addLayer(
				leaflet.circle([selfTarget.latitude, selfTarget.longitude], {
					radius: i * step * metersPerNm,
					color: "gray",
					weight: 1,
					opacity: 0.7,
					fill: false,
					interactive: false,
					zIndexOffset: -999,
				}),
			);

			rangeRings.addLayer(
				rangeLabel({
					leaflet,
					lat: selfTarget.latitude + (i * step) / 60,
					lon: selfTarget.longitude,
					content: `${i * step} NM`,
					offset: [0, 15],
				}),
			);

			rangeRings.addLayer(
				rangeLabel({
					leaflet,
					lat: selfTarget.latitude - (i * step) / 60,
					lon: selfTarget.longitude,
					content: `${i * step} NM`,
					offset: [0, -15],
				}),
			);
		}

		rangeRings.addTo(map);
		lastSignature = signature;
		return true;
	}

	return { draw };
}

export function rangeRingStep(mapHeightInNauticalMiles) {
	const rawStep = mapHeightInNauticalMiles / 6;
	if (rawStep < 0.125) return 0.125;
	if (rawStep < 0.25) return 0.25;
	if (rawStep < 0.5) return 0.5;
	if (rawStep < 1) return 1;
	return 2 * Math.round(rawStep / 2);
}

function rangeRingsSignature({ selfTarget, step, metersPerNm }) {
	return [
		numberKey(selfTarget.latitude, 7),
		numberKey(selfTarget.longitude, 7),
		numberKey(step, 3),
		numberKey(metersPerNm, 3),
	].join("|");
}

function numberKey(value, digits) {
	const number = Number(value);
	return Number.isFinite(number) ? number.toFixed(digits) : "";
}

function rangeLabel({ leaflet, lat, lon, content, offset }) {
	return leaflet.tooltip([lat, lon], {
		content,
		permanent: true,
		direction: "center",
		opacity: 0.7,
		offset,
		className: "map-labels",
		interactive: false,
		zIndexOffset: -999,
	});
}
