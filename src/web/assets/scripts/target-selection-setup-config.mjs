/**
 * Builds setup configuration for target selection in the AJRM Marine Display browser application.
 */

import { targetSelectionConfig } from "./target-ui-config.mjs";

export function configuredTargetSelectionConfig({
	pluginId,
	map,
	boatMarkers,
	targets,
	metersPerNm,
	getSelfMmsi,
	getSelectedVesselMmsi,
	setSelectedVesselMmsi,
	selectionMarkers,
	targetSilence,
	getHttpResponse,
	serverAlertEvents,
	getTargetMapRenderer,
	clearAlert,
	requiredElement,
	elements,
	modals,
	offcanvas,
}) {
	return targetSelectionConfig({
		pluginId,
		map,
		boatMarkers,
		targets,
		metersPerNm,
		getSelfMmsi,
		getSelectedVesselMmsi,
		setSelectedVesselMmsi,
		selectionMarkers,
		targetSilence,
		getHttpResponse,
		serverAlertEvents,
		getTargetMapRenderer,
		clearAlert,
		requiredElement,
		elements,
		modals,
		offcanvas,
	});
}
