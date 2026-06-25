export function positionMapModal({ map, latLng, modalId, mapElementId = "map" }) {
	const clickedLocationInPixels = map.latLngToContainerPoint(latLng);
	const mapWidthInPixels = document.getElementById(mapElementId).clientWidth;
	const modalDialog = document.getElementById(modalId).children[0];

	if (mapWidthInPixels > 600) {
		if (clickedLocationInPixels.x > mapWidthInPixels / 2) {
			modalDialog.style.marginLeft = "100px";
			modalDialog.style.marginRight = "auto";
		} else {
			modalDialog.style.marginLeft = "auto";
			modalDialog.style.marginRight = "100px";
		}
	} else {
		modalDialog.removeAttribute("style");
	}
}
