/**
 * Coordinates view rendering for target map renderer in the AJRM Marine Display browser application.
 */

import { updateRendererSelectedVesselDetails } from "./target-map-renderer-selected-details.mjs";
import {
	drawRendererRangeRings,
	updateRendererHarbourDisplay,
	updateRendererTargetTable,
} from "./target-map-renderer-view-actions.mjs";

export function createTargetMapRendererViewController({
	documentRef,
	targets,
	targetSilence,
	rangeRings,
	harbourDisplay,
	getSelfMmsi,
	getSelfTarget,
	getSortTableBy,
	getDisplayHarbours,
}) {
	function updateTableOfTargets() {
		updateRendererTargetTable({
			document: documentRef,
			targets,
			selfMmsi: getSelfMmsi(),
			sortBy: getSortTableBy(),
			targetSilence,
		});
	}

	function updateSelectedVesselProperties(target) {
		updateRendererSelectedVesselDetails({
			document: documentRef,
			target,
			targetSilence,
			isSelf: target?.mmsi === getSelfMmsi(),
		});
	}

	function drawRangeRings({ enabled = true } = {}) {
		drawRendererRangeRings({
			enabled,
			rangeRings,
			selfTarget: getSelfTarget(),
		});
	}

	async function updateHarbourDisplay() {
		await updateRendererHarbourDisplay({
			harbourDisplay,
			enabled: getDisplayHarbours(),
		});
	}

	return {
		drawRangeRings,
		updateHarbourDisplay,
		updateSelectedVesselProperties,
		updateTableOfTargets,
	};
}
