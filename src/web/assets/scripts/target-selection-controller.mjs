import { showVesselDetailsAfterClosebyChooser as showClosebyDetailsAfterChooser } from "./target-selection-closeby-details.mjs";
import { selectTargetFromClosebyList } from "./target-selection-closeby-list-click.mjs";
import { showSelectedVesselDetails as showSelectedVesselDetailsForMarker } from "./target-selection-details.mjs";
import { clearSelectedTargetFromMapClick } from "./target-selection-map-click.mjs";
import { handleTargetMarkerClick } from "./target-selection-marker-click.mjs";
import {
	positionTargetModal,
	showSelectedVesselModal,
} from "./target-selection-modal-actions.mjs";
import { selectBoatMarkerForDetails } from "./target-selection-select-marker.mjs";
import { handleTargetTableMuteClick } from "./target-selection-table-mute-click.mjs";
import { selectTargetFromTableRow } from "./target-selection-table-row.mjs";

export function createTargetSelectionController({
	pluginId,
	map,
	boatMarkers,
	targets,
	metersPerNm,
	getSelfMmsi,
	getSelectedVesselMmsi,
	setSelectedVesselMmsi,
	getSelectionMarkers,
	targetSilence,
	getHttpResponse,
	refreshServerAlertEvents,
	updateSingleVesselUI,
	updateSelectedVesselProperties,
	updateTableOfTargets,
	clearAlert,
	closebyListContainer,
	closebyModalElement,
	closebyModal,
	targetListOffcanvas,
	selectedVesselModal,
}) {
	function handleTableOfTargetsBodyClick(ev) {
		if (
			handleTargetTableMuteClick({
				event: ev,
				getHttpResponse,
				pluginId,
				refreshServerAlertEvents,
				targets,
				targetSilence,
				updateTableOfTargets,
			})
		) {
			return;
		}

		selectTargetFromTableRow({
			eventTarget: ev.target,
			boatMarkers,
			getSelfMmsi,
			map,
			selectBoatMarker,
			showSelectedVesselDetails,
			targetListOffcanvas,
		});
	}

	function boatClicked(event) {
		handleTargetMarkerClick({
			event,
			boatMarkers,
			closebyListContainer,
			closebyModal,
			map,
			metersPerNm,
			getSelfMmsi,
			positionModalWindow,
			selectBoatMarker,
			showSelectedVesselDetails,
			targets,
		});
	}

	function handleListOfClosebyBoatsClick(event) {
		selectTargetFromClosebyList({
			event,
			boatMarkers,
			closebyModal,
			closebyModalElement,
			selectBoatMarker,
			showClosebyDetailsAfterChooser,
			showSelectedVesselDetails,
		});
	}

	function showSelectedVesselDetails(boatMarker) {
		showSelectedVesselDetailsForMarker({
			boatMarker,
			positionModalWindow,
			showModalSelectVesselProperties,
			targets,
		});
	}

	function showModalSelectVesselProperties(target) {
		showSelectedVesselModal({
			clearAlert,
			selectedVesselModal,
			target,
			updateSelectedVesselProperties,
		});
	}

	function positionModalWindow(latLng, modalId) {
		positionTargetModal({ map, latLng, modalId });
	}

	function selectBoatMarker(boatMarker) {
		selectBoatMarkerForDetails({
			boatMarker,
			getSelectedVesselMmsi,
			getSelfMmsi,
			getSelectionMarkers,
			map,
			setSelectedVesselMmsi,
			targets,
			updateSingleVesselUI,
		});
	}

	function handleMapClick() {
		clearSelectedTargetFromMapClick({
			getSelectedVesselMmsi,
			getSelfMmsi,
			getSelectionMarkers,
			map,
			setSelectedVesselMmsi,
			targets,
			updateSingleVesselUI,
		});
	}

	return {
		boatClicked,
		handleListOfClosebyBoatsClick,
		handleMapClick,
		handleTableOfTargetsBodyClick,
		positionModalWindow,
		selectBoatMarker,
		showModalSelectVesselProperties,
	};
}
