import * as L from "leaflet";
import * as aisIcons from "./ais-icons.mjs";
import {
	ageOutRendererTargets,
	removeMissingRendererTargets,
} from "./target-map-renderer-aging.mjs";
import { createTargetMapRendererCountController } from "./target-map-renderer-count-controller.mjs";
import { updateRendererSingleTarget } from "./target-map-renderer-single-target.mjs";
import { updateRendererUi } from "./target-map-renderer-update-ui.mjs";
import { createTargetMapRendererViewController } from "./target-map-renderer-view-controller.mjs";

export function createTargetMapRenderer({
	map,
	targets,
	boatMarkers,
	boatProjectedCourseLines,
	targetOverlays,
	labelCollision,
	rangeRings,
	autoCharts,
	harbourDisplay,
	autoProfileSettings,
	speechOutput,
	serverAlertEvents,
	targetSilence,
	targetSelection,
	selectionMarkers,
	selectedVesselModal,
	countElements,
	getSelfMmsi,
	getSelfTarget,
	getCollisionProfiles = () => ({}),
	getSelectedVesselMmsi,
	setSelectedVesselMmsi,
	getSortTableBy,
	getMapFollowSelf,
	getDisableMapPanTo,
	getDisplayHarbours,
	setDisableMoveend,
	targetMaxAge,
	courseProjectionMinutes,
}) {
	const { countState, getAlarmTargetCount, resetTargetCounts } =
		createTargetMapRendererCountController();
	const {
		drawRangeRings,
		updateHarbourDisplay,
		updateSelectedVesselProperties,
		updateTableOfTargets,
	} = createTargetMapRendererViewController({
		documentRef: document,
		targets,
		targetSilence,
		rangeRings,
		harbourDisplay,
		getSelfMmsi,
		getSelfTarget,
		getSortTableBy,
		getDisplayHarbours,
	});

	function updateUI({ uiState, allowServerFallbackRefresh } = {}) {
		updateRendererUi({
			selfTarget: getSelfTarget(),
			map,
			shouldFollow: getMapFollowSelf(),
			disableMapPanTo: getDisableMapPanTo(),
			setDisableMoveend,
			drawRangeRings,
			autoCharts,
			updateHarbourDisplay,
			autoProfileSettings,
			collisionProfiles: getCollisionProfiles(),
			targets,
			selectedVesselMmsi: getSelectedVesselMmsi(),
			updateSingleVesselUI,
			updateSelectedVesselProperties,
			labelCollision,
			updateTableOfTargets,
			speechOutput,
			serverAlertEvents,
			uiState,
			allowServerFallbackRefresh,
			countState,
			countElements,
		});
	}

	function updateSingleVesselUI(target, options = {}) {
		updateRendererSingleTarget({
			L,
			aisIcons,
			map,
			target,
			boatMarkers,
			boatProjectedCourseLines,
			targetOverlays,
			labelCollision,
			targetSelection,
			selectionMarkers,
			countState,
			targets,
			getSelfMmsi,
			getCollisionProfiles: () =>
				options.collisionProfiles ?? getCollisionProfiles(),
			getSelectedVesselMmsi,
			collisionProfiles: options.collisionProfiles,
			courseProjectionMinutes,
			deferLabelCollision: options.deferLabelCollision === true,
			deferMapOverlays: options.deferMapOverlays === true,
		});
	}

	function ageOutOldTargets() {
		ageOutRendererTargets({
			targets,
			selfMmsi: getSelfMmsi(),
			selectedVesselMmsi: getSelectedVesselMmsi(),
			targetMaxAge,
			boatMarkers,
			boatProjectedCourseLines,
			targetOverlays,
			labelCollision,
			map,
			selectionMarkers,
			selectedVesselModal,
			setSelectedVesselMmsi,
		});
	}

	function removeMissingTargets(mmsis) {
		removeMissingRendererTargets({
			mmsis,
			selectedVesselMmsi: getSelectedVesselMmsi(),
			boatMarkers,
			boatProjectedCourseLines,
			targetOverlays,
			labelCollision,
			map,
			selectionMarkers,
			selectedVesselModal,
			setSelectedVesselMmsi,
		});
	}

	return {
		ageOutOldTargets,
		drawRangeRings,
		getAlarmTargetCount,
		resetTargetCounts,
		updateHarbourDisplay,
		updateSelectedVesselProperties,
		updateSingleVesselUI,
		updateTableOfTargets,
		updateUI,
		removeMissingTargets,
	};
}
