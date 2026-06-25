import {
	createVesselSizeCategoryResolver,
	labelCollisionConfig,
	rangeRingsConfig,
	selectionMarkersConfig,
	targetOverlaysConfig,
	targetSilenceConfig,
} from "./target-support-config.mjs";

export function configuredTargetSilenceConfig({
	pluginId,
	targets,
	getSelfMmsi,
	getSelectedVesselMmsi,
	serverAlertEvents,
	getHttpResponse,
	getTargetMapRenderer,
	showAlert,
}) {
	return targetSilenceConfig({
		pluginId,
		targets,
		getSelfMmsi,
		getSelectedVesselMmsi,
		serverAlertEvents,
		getHttpResponse,
		getTargetMapRenderer,
		showAlert,
	});
}

export function configuredRangeRingsConfig({ map, metersPerNm }) {
	return rangeRingsConfig({
		map,
		metersPerNm,
	});
}

export function configuredVesselSizeCategory({
	collisionProfileService,
	getCollisionProfiles,
}) {
	return createVesselSizeCategoryResolver({
		collisionProfileService,
		getCollisionProfiles,
	});
}

export function configuredTargetOverlaysConfig({
	map,
	getSelfMmsi,
	getCollisionProfiles,
	setCollisionProfiles,
	collisionProfileService,
	vesselSizeCategory,
	metersPerNm,
}) {
	return targetOverlaysConfig({
		map,
		getSelfMmsi,
		getCollisionProfiles,
		setCollisionProfiles,
		collisionProfileService,
		vesselSizeCategory,
		metersPerNm,
	});
}

export function configuredSelectionMarkersConfig({ L }) {
	return selectionMarkersConfig({ L });
}

export function configuredLabelCollisionConfig({ map }) {
	return labelCollisionConfig({ map });
}
