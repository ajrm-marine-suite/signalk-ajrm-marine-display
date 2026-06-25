export function createSelectionMarkers({ L, getBlueBoxIcon }) {
	const blueBoxIcon = L.marker([], {
		icon: getBlueBoxIcon(),
	});

	const blueCircle1 = createBlueCircleMarker(L);
	const blueCircle2 = createBlueCircleMarker(L);
	const blueLayerGroup = L.layerGroup();

	blueLayerGroup.addLayer(blueBoxIcon);
	blueLayerGroup.addLayer(blueCircle1);
	blueLayerGroup.addLayer(blueCircle2);

	return {
		blueBoxIcon,
		blueCircle1,
		blueCircle2,
		blueLayerGroup,
	};
}

function createBlueCircleMarker(L) {
	return L.circleMarker([], {
		radius: 6,
		color: "blue",
		opacity: 1.0,
		fillOpacity: 1.0,
		interactive: false,
		className: "blueStuff",
	});
}
