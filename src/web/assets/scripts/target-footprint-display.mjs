import { footprintLatLngs } from "../../../shared/vessel-footprint.mjs";

export function updateTargetFootprintDisplay({
	footprintPolygon,
	target,
	selfMmsi,
	selectedVesselMmsi,
	enabled = displayScaledVesselShapesEnabled(),
}) {
	if (!footprintPolygon) return;
	const state = targetFootprintDisplayState({
		enabled,
		target,
		selfMmsi,
		selectedVesselMmsi,
	});
	if (footprintPolygon._ajrmMarineFootprintState === state.key) return;
	footprintPolygon._ajrmMarineFootprintState = state.key;
	if (
		!state.show
	) {
		footprintPolygon.setLatLngs([]);
		return;
	}
	const latLngs = footprintLatLngs(target, {
		assumedClassALengthMeters: 100,
		assumedClassBLengthMeters: 12,
		assumedUnknownLengthMeters: 30,
		assumedBeamToLengthRatio: 0.15,
		vesselGpsFromBowFraction: vesselGpsFromBowFraction(),
		classAGpsFromBowFraction: classAGpsFromBowFraction(),
	});
	footprintPolygon.setLatLngs(latLngs);
}

export function targetFootprintDisplayState({
	enabled,
	target,
	selfMmsi,
	selectedVesselMmsi,
}) {
	const show =
		enabled &&
		target.mmsi !== selfMmsi &&
		target.mmsi !== selectedVesselMmsi;
	if (!show) return { show, key: "hidden" };
	return {
		show,
		key: [
			"shown",
			target.mmsi,
			target.latitude,
			target.longitude,
			target.hdg,
			target.cog,
			target.aisClass,
			target.beam,
			target.length,
			target.vesselGpsFromBow,
			target.vesselGpsFromCenter,
			target.vesselFootprint?.source,
			target.vesselFootprint?.toBow,
			target.vesselFootprint?.toStern,
			target.vesselFootprint?.toPort,
			target.vesselFootprint?.toStarboard,
			vesselGpsFromBowFraction(),
			classAGpsFromBowFraction(),
		].join("|"),
	};
}

function displayScaledVesselShapesEnabled() {
	const controls = globalThis.window?.ajrmMarineSpeechControls;
	return controls?.displayScaledVesselShapes?.checked !== false;
}

function vesselGpsFromBowFraction() {
	const value = Number(
		globalThis.window?.ajrmMarineEncounterSettings?.vesselGpsFromBowFraction,
	);
	if (!Number.isFinite(value)) return 0.75;
	return Math.min(1, Math.max(0, value));
}

function classAGpsFromBowFraction() {
	const value = Number(
		globalThis.window?.ajrmMarineEncounterSettings?.classAGpsFromBowFraction,
	);
	if (!Number.isFinite(value)) return 0.85;
	return Math.min(1, Math.max(0, value));
}
