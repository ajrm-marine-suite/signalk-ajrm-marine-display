import * as targetSvgs from "./ship-icons.mjs";
import {
	isAisAtonTarget,
	isAisSpecialSafetyMmsi,
} from "../../../shared/target-classification.mjs";

export function getTargetSvg(target) {
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

	// everything else
	else return targetSvgs.ufoSvg;
}
