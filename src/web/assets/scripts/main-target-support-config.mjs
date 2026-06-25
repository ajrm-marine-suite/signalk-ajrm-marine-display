import {
	METERS_PER_NM,
	PLUGIN_ID,
} from "./app-constants.mjs";

export function mainTargetSupportConfig({
	L,
	map,
	targets,
	serverAlertEvents,
	getHttpResponse,
	state,
	collisionProfileService,
	feedback,
	getTargetMapRenderer,
}) {
	return {
		L,
		map,
		pluginId: PLUGIN_ID,
		targets,
		serverAlertEvents,
		getHttpResponse,
		getSelfMmsi: state.getSelfMmsi,
		getSelectedVesselMmsi: state.getSelectedVesselMmsi,
		getCollisionProfiles: state.getCollisionProfiles,
		setCollisionProfiles: state.setCollisionProfiles,
		collisionProfileService,
		getTargetMapRenderer,
		showAlert: feedback.showAlert,
		metersPerNm: METERS_PER_NM,
	};
}
