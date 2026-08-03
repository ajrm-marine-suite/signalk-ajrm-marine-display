import {
	AIS_TARGET_KIND_SAR_AIRCRAFT,
	classifyAisTarget,
	isAisAtonTarget,
	isAisBaseStationTarget,
	isAisSpecialSafetyMmsi,
} from "../../../shared/target-classification.mjs";

export function isSpecialSafetyMmsi(mmsi) {
	return isAisSpecialSafetyMmsi(mmsi);
}

export function targetIconFor({
	aisIcons,
	target,
	selfMmsi,
	selfIconVariant = "rings",
	selfIconOrientation = "heading",
	selfIconFillColor = "#ff00ff",
	selfIconScalePercent = 100,
	isLarge = false,
	color = "black",
}) {
	if (target.mmsi === selfMmsi) {
		return aisIcons.getSelfIcon(
			target,
			selfIconVariant,
			selfIconFillColor,
			selfIconScalePercent,
			selfIconOrientation,
		);
	}
	if (classifyAisTarget(target).targetKind === AIS_TARGET_KIND_SAR_AIRCRAFT) {
		return aisIcons.getAircraftIcon(target, isLarge, color);
	}
	if (isSpecialSafetyMmsi(target.mmsi)) {
		return aisIcons.getSartIcon();
	}
	if (isAisAtonTarget(target)) {
		return aisIcons.getAtonIcon(target, isLarge, color);
	}
	if (target.aisClass === "A") {
		return aisIcons.getClassAIcon(target, isLarge, color);
	}
	if (isAisBaseStationTarget(target)) {
		return aisIcons.getBaseIcon(target, isLarge, color);
	}
	if (target.aisClass === "B") {
		return aisIcons.getClassBIcon(target, isLarge, color);
	}
	return aisIcons.getUnknownVesselIcon(target, isLarge, color);
}
