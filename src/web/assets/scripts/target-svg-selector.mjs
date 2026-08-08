/**
 * Implements the target SVG selector responsibilities of the AJRM Marine Display browser application.
 */

import * as targetSvgs from "./ship-icons.mjs";
import {
	AIS_TARGET_KIND_SAR_AIRCRAFT,
	classifyAisTarget,
	isAisAtonTarget,
	isAisSpecialSafetyMmsi,
} from "../../../shared/target-classification.mjs";

export function getTargetSvg(target) {
	if (classifyAisTarget(target).targetKind === AIS_TARGET_KIND_SAR_AIRCRAFT) {
		return targetSvgs.aircraftSvg;
	}

	// fishing
	if (target.typeId === 30) {
		return targetSvgs.fishingboatSvg;
	}

	// sailing
	else if (target.typeId === 36) {
		return targetSvgs.sailboatSvg;
	}

	// pleasure
	else if (target.typeId === 37) {
		return targetSvgs.powerboatSvg;
	}

	// sar
	else if (target.typeId === 51 || isAisSpecialSafetyMmsi(target.mmsi)) {
		return targetSvgs.sarSvg;
	}

	// tug
	else if (target.typeId === 52) {
		return targetSvgs.tugboatSvg;
	}

	// other class A
	else if (target.aisClass === "A") {
		return targetSvgs.shipSvg;
	}

	// aton
	else if (isAisAtonTarget(target)) {
		return targetSvgs.atonSvg;
	}

	// explicitly reported Class B
	else if (target.aisClass === "B") {
		return targetSvgs.powerboatSvg;
	}

	// everything else
	else return targetSvgs.ufoSvg;
}
