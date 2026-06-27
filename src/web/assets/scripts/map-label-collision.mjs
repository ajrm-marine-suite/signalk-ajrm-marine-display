import * as labelgun from "labelgun";

export function createMapLabelCollisionController({
	map,
	createController = createLabelgunController,
}) {
	const controller = createController({ hideLabel, showLabel });
	const ingestedSignatures = new Map();
	let dirty = false;

	function update() {
		if (!dirty) return false;
		controller.update();
		dirty = false;
		return true;
	}

	function add(layer, id, weight) {
		const signature = labelCollisionSignature({ layer, id, weight, map });
		if (ingestedSignatures.get(id) === signature) return false;

		const label = tooltipLabel(layer);
		if (!label) return false;

		const rect = label.getBoundingClientRect();
		const bottomLeft = map.containerPointToLatLng([rect.left, rect.bottom]);
		const topRight = map.containerPointToLatLng([rect.right, rect.top]);

		controller.ingestLabel(
			{
				bottomLeft: [bottomLeft.lng, bottomLeft.lat],
				topRight: [topRight.lng, topRight.lat],
			},
			id,
			-weight,
			label,
			id,
			false,
		);
		ingestedSignatures.set(id, signature);
		dirty = true;
		return true;
	}

	function remove(id) {
		ingestedSignatures.delete(id);
		controller.removeLabel(id, null);
		dirty = true;
	}

	return { add, remove, update };
}

function createLabelgunController({ hideLabel, showLabel }) {
	return new labelgun.default(hideLabel, showLabel);
}

function tooltipLabel(layer) {
	return layer.getTooltip?.()?._source?._tooltip?._container || null;
}

function labelCollisionSignature({ layer, id, weight, map }) {
	const markerPosition = markerPositionSignature(layer);
	const view = mapViewSignature(map);
	return [
		id,
		weight,
		markerPosition,
		view,
		layer._ajrmMarineTooltipHtml || "",
	].join("|");
}

function markerPositionSignature(layer) {
	const latLng = markerLatLng(layer);
	return `${numberKey(latLng?.lat, 7)},${numberKey(latLng?.lng, 7)}`;
}

function markerLatLng(layer) {
	if (Array.isArray(layer?._ajrmMarineLatLng)) {
		return {
			lat: layer._ajrmMarineLatLng[0],
			lng: layer._ajrmMarineLatLng[1],
		};
	}
	return layer?.getLatLng?.() || null;
}

function mapViewSignature(map) {
	const center = map?.getCenter?.();
	return [
		numberKey(map?.getZoom?.(), 3),
		numberKey(center?.lat, 7),
		numberKey(center?.lng, 7),
	].join(",");
}

function numberKey(value, digits) {
	const number = Number(value);
	return Number.isFinite(number) ? number.toFixed(digits) : "";
}

function hideLabel(label) {
	label.labelObject.style.opacity = 0;
}

function showLabel(label) {
	label.labelObject.style.opacity = 1;
}
