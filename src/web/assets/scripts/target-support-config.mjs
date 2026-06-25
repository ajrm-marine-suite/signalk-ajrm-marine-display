import { getBlueBoxIcon } from "./ais-icons.mjs";
import { criteriaForSize } from "./profile-settings.mjs";

export function targetSilenceConfig({
	pluginId,
	targets,
	getSelfMmsi,
	getSelectedVesselMmsi,
	serverAlertEvents,
	getHttpResponse,
	getTargetMapRenderer,
	showAlert,
}) {
	return {
		pluginId,
		targets,
		getSelfMmsi,
		getSelectedVesselMmsi,
		serverAlertEvents,
		getHttpResponse,
		getTargetMapRenderer,
		showAlert,
	};
}

export function rangeRingsConfig({ map, metersPerNm }) {
	return { map, metersPerNm };
}

export function createVesselSizeCategoryResolver({
	collisionProfileService,
	getCollisionProfiles,
}) {
	return (target) =>
		collisionProfileService.vesselSizeCategory(
			target,
			getCollisionProfiles(),
		);
}

export function targetOverlaysConfig({
	map,
	getSelfMmsi,
	getCollisionProfiles,
	setCollisionProfiles,
	collisionProfileService,
	vesselSizeCategory,
	metersPerNm,
}) {
	return {
		map,
		getSelfMmsi,
		getCollisionProfiles,
		setCollisionProfiles,
		normalizeCollisionProfiles:
			collisionProfileService.normalizeCollisionProfiles,
		vesselSizeCategory,
		criteriaForSize,
		metersPerNm,
	};
}

export function selectionMarkersConfig({ L }) {
	return { L, getBlueBoxIcon };
}

export function labelCollisionConfig({ map }) {
	return { map };
}
