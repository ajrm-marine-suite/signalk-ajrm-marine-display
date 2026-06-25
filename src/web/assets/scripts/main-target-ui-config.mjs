import {
	AGE_OUT_OLD_TARGETS,
	COURSE_PROJECTION_MINUTES,
	DEFAULT_MAXIMUM_TARGET_RANGE,
	METERS_PER_NM,
	PLUGIN_ID,
	SHOW_ALARMS_INTERVAL,
	TARGET_MAX_AGE,
} from "./app-constants.mjs";

export function mainTargetUiCollectionsConfig({ collections, targetSupport }) {
	return {
		boatMarkers: collections.boatMarkers,
		targets: collections.targets,
		boatProjectedCourseLines: collections.boatProjectedCourseLines,
		targetOverlays: targetSupport.targetOverlays,
		labelCollision: targetSupport.labelCollision,
		rangeRings: targetSupport.rangeRings,
		targetSilence: targetSupport.targetSilence,
		selectionMarkers: targetSupport.selectionMarkers,
	};
}

export function mainTargetUiIdentityConfig() {
	return {
		pluginId: PLUGIN_ID,
	};
}

export function mainTargetUiStateConfig({
	state,
	mapControls,
	mapFollow,
	harbourDisplay,
}) {
	return {
		getSelfMmsi: state.getSelfMmsi,
		getSelfTarget: state.getSelfTarget,
		setSelfTarget: state.setSelfTarget,
		getSelectedVesselMmsi: state.getSelectedVesselMmsi,
		setSelectedVesselMmsi: state.setSelectedVesselMmsi,
		getSortTableBy: state.getSortTableBy,
		getMapFollowSelf: mapFollow.getMapFollowSelf,
		getDisableMapPanTo: state.getDisableMapPanTo,
		getDisplayHarbours: () => harbourDisplay?.isEnabled?.() === true,
		setDisableMoveend: state.setDisableMoveend,
		getCollisionProfiles: state.getCollisionProfiles,
		replayStatusControls: {
			status: mapControls.replayStatus,
			mode: mapControls.replayMode,
			time: mapControls.replayTime,
			file: mapControls.replayFile,
		},
	};
}

export function mainTargetUiConstantsConfig() {
	return {
		metersPerNm: METERS_PER_NM,
		maximumTargetRange: DEFAULT_MAXIMUM_TARGET_RANGE,
		targetMaxAge: TARGET_MAX_AGE,
		ageOutEnabled: AGE_OUT_OLD_TARGETS,
		courseProjectionMinutes: COURSE_PROJECTION_MINUTES,
		showAlarmsInterval: SHOW_ALARMS_INTERVAL,
	};
}
