import { updateTargetCourseLine } from "./target-course-line-update.mjs";
import { updateTargetFootprintDisplay } from "./target-footprint-display.mjs";
import { displayDebugControls } from "./display-debug-controls.mjs";
import { createTargetMarkerBundle } from "./target-marker-bundle.mjs";
import { updateTargetMarkerView } from "./target-marker-view-update.mjs";
import { applyNonSelfTargetMarkerPresentation } from "./non-self-target-marker-presentation.mjs";
import { loadSelfTcpaGuideSettings } from "./self-tcpa-guide-settings.mjs";
import { targetIconPresentation } from "./target-presentation.mjs";
import { targetIconFor } from "./target-icon-resolver.mjs";
import {
	rememberTargetIcon,
	resolveCachedTargetIcon,
	targetIconCacheKey,
} from "./target-icon-cache.mjs";

export function updateRendererSingleTarget({
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
	getCollisionProfiles = () => ({}),
	getSelectedVesselMmsi,
	collisionProfiles,
	courseProjectionMinutes,
	deferLabelCollision = false,
	deferMapOverlays = false,
	getSelfIconVariant = () => defaultSelfIconVariant(),
	createMarkerBundle = createTargetMarkerBundle,
	getIconPresentation = targetIconPresentation,
	getIcon = targetIconFor,
	updateMarkerView = updateTargetMarkerView,
	applyMarkerPresentation = applyNonSelfTargetMarkerPresentation,
	updateCourseLine = updateTargetCourseLine,
}) {
	if (!target.isValid) {
		targetOverlays.removeCpaLimitRings(target?.mmsi);
		return;
	}

	let boatMarker = boatMarkers.get(target.mmsi);
	let boatProjectedCourseLine = boatProjectedCourseLines.get(target.mmsi);
	const selfMmsi = getSelfMmsi();
	const selectedVesselMmsi = getSelectedVesselMmsi();
	const currentCollisionProfiles = collisionProfiles ?? getCollisionProfiles();
	const debugControls = displayDebugControls();
	const selfIconSettings = target.mmsi === selfMmsi
		? getSelfIconSettings(getSelfIconVariant)
		: {};
	if (!deferMapOverlays) {
		targetOverlays.updateCpaLimitRings(target, currentCollisionProfiles);
	}

	if (!boatMarker) {
		const initialIconArgs = {
			aisIcons,
			target,
			selfMmsi,
			...selfIconSettings,
			isLarge: false,
			color: "black",
		};
		const initialIconKey = targetIconCacheKey(initialIconArgs);
		const icon = getIcon(initialIconArgs);
		const markerBundle = createMarkerBundle({
			L,
			map,
			target,
			selfMmsi,
			targetSelection,
			icon,
		});
		boatMarker = markerBundle.boatMarker;
		boatProjectedCourseLine = markerBundle.boatProjectedCourseLine;
		boatMarker.footprintPolygon = markerBundle.boatFootprintPolygon;
		boatMarkers.set(target.mmsi, boatMarker);
		boatProjectedCourseLines.set(target.mmsi, boatProjectedCourseLine);
		rememberTargetIcon({
			marker: boatMarker,
			cacheKey: initialIconKey,
			icon,
		});
	}

	const vesselIcon = getIconPresentation({
		target,
		selectedVesselMmsi,
	});
	const iconArgs = {
		aisIcons,
		target,
		selfMmsi,
		...selfIconSettings,
		isLarge: vesselIcon.isLarge,
		color: vesselIcon.color,
	};
	const icon = resolveCachedTargetIcon({
		marker: boatMarker,
		cacheKey: targetIconCacheKey(iconArgs),
		createIcon: () => getIcon(iconArgs),
	});

	if (debugControls.markerUpdates) {
		updateMarkerView({
			boatMarker,
			target,
			icon,
			selectionMarkers,
			selectedVesselMmsi,
			targetOverlays,
		});
	}
	if (!deferMapOverlays) {
		updateTargetFootprintDisplay({
			footprintPolygon: boatMarker.footprintPolygon,
			target,
			selfMmsi,
			selectedVesselMmsi,
			enabled: debugControls.footprints,
		});
	}

	const { blueCircle1, blueCircle2 } = selectionMarkers;

	countState.add(applyMarkerPresentation({
		target,
		selfMmsi,
			boatMarker,
			labelCollision,
			deferLabelCollision: deferLabelCollision || !debugControls.labels,
	}));

	if (!deferMapOverlays && debugControls.courseLines) {
		updateCourseLine({
			target,
			selfMmsi,
			selectedVesselMmsi,
			targets,
			line: boatProjectedCourseLine,
			blueCircle1,
			blueCircle2,
			map,
			L,
			collisionProfiles: currentCollisionProfiles,
			courseProjectionMinutes,
			vesselIcon,
		});
	}
}

function defaultSelfIconVariant() {
	if (!globalThis.localStorage) return "rings";
	return loadSelfTcpaGuideSettings().selfIcon;
}

function getSelfIconSettings(getSelfIconVariant) {
	const settings = globalThis.localStorage
		? loadSelfTcpaGuideSettings()
		: { selfIconFillColor: "#ff00ff" };
	return {
		selfIconVariant: getSelfIconVariant(),
		selfIconFillColor: settings.selfIconFillColor,
	};
}
