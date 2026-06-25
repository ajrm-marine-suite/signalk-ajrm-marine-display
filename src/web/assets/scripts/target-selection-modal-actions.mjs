import { positionMapModal } from "./map-modal-position.mjs";

export function showSelectedVesselModal({
	clearAlert,
	selectedVesselModal,
	target,
	updateSelectedVesselProperties,
}) {
	updateSelectedVesselProperties(target);
	clearAlert();
	selectedVesselModal.show();
}

export function positionTargetModal({ map, latLng, modalId }) {
	positionMapModal({ map, latLng, modalId });
}
