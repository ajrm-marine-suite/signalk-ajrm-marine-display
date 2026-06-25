export function showVesselDetailsAfterClosebyChooser({
	boatMarker,
	closebyModalElement,
	closebyModal,
	showSelectedVesselDetails,
}) {
	const showDetails = () => {
		showSelectedVesselDetails(boatMarker);
	};

	if (!closebyModalElement.classList.contains("show")) {
		showDetails();
		return;
	}

	closebyModalElement.addEventListener("hidden.bs.modal", showDetails, {
		once: true,
	});
	closebyModal.hide();
}
