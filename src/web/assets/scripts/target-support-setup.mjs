import {
	configuredLabelCollisionConfig,
	configuredRangeRingsConfig,
	configuredSelectionMarkersConfig,
	configuredTargetOverlaysConfig,
	configuredTargetSilenceConfig,
	configuredVesselSizeCategory,
} from "./target-support-setup-configs.mjs";
import { resolveTargetSupportFactories } from "./target-support-factories.mjs";

export {
	configuredLabelCollisionConfig,
	configuredRangeRingsConfig,
	configuredSelectionMarkersConfig,
	configuredTargetOverlaysConfig,
	configuredTargetSilenceConfig,
	configuredVesselSizeCategory,
} from "./target-support-setup-configs.mjs";

export function createConfiguredTargetSupport({
	L,
	map,
	pluginId,
	targets,
	serverAlertEvents,
	getHttpResponse,
	getSelfMmsi,
	getSelectedVesselMmsi,
	getCollisionProfiles,
	setCollisionProfiles,
	collisionProfileService,
	getTargetMapRenderer,
	showAlert,
	metersPerNm,
	factories = {},
}) {
	const {
		createTargetSilence,
		createRangeRings,
		createTargetOverlays,
		createSelection,
		createLabelCollision,
	} = resolveTargetSupportFactories(factories);

	const targetSilence = createTargetSilence(configuredTargetSilenceConfig({
		pluginId,
		targets,
		getSelfMmsi,
		getSelectedVesselMmsi,
		serverAlertEvents,
		getHttpResponse,
		getTargetMapRenderer,
		showAlert,
	}));
	const rangeRings = createRangeRings(configuredRangeRingsConfig({
		map,
		metersPerNm,
	}));
	const vesselSizeCategory = configuredVesselSizeCategory({
		collisionProfileService,
		getCollisionProfiles,
	});
	const targetOverlays = createTargetOverlays(configuredTargetOverlaysConfig({
		map,
		getSelfMmsi,
		getCollisionProfiles,
		setCollisionProfiles,
		collisionProfileService,
		vesselSizeCategory,
		metersPerNm,
	}));
	const selectionMarkers = createSelection(configuredSelectionMarkersConfig({ L }));
	const labelCollision = createLabelCollision(configuredLabelCollisionConfig({ map }));

	return {
		labelCollision,
		rangeRings,
		selectionMarkers,
		targetOverlays,
		targetSilence,
		vesselSizeCategory,
	};
}
