import {
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
	selfIconFillColor = "#ff00ff",
	isLarge = false,
	color = "black",
}) {
	if (target.mmsi === selfMmsi) {
		return aisIcons.getSelfIcon(target, selfIconVariant, selfIconFillColor);
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
	return aisIcons.getClassBIcon(target, isLarge, color);
}
