import {
	distanceRangeControlState,
	speedRangeControlState,
	tcpaRangeControlState,
} from "./profile-edit-range-control-state.mjs";
import { processProfileRangeControl } from "./profile-edit-range-processing.mjs";

export function createProfileEditRangeHandlers({
	getProfiles,
	selectedRangeCriteria,
	documentObject = document,
	rangeProcessor = processProfileRangeControl,
}) {
	function processRangeControl(event, stateForRange) {
		rangeProcessor({
			event,
			profiles: getProfiles(),
			selectedRangeCriteria,
			stateForRange,
			documentObject,
		});
	}

	return {
		processDistanceRangeControl: (event) =>
			processRangeControl(event, distanceRangeControlState),
		processTcpaRangeControl: (event) =>
			processRangeControl(event, tcpaRangeControlState),
		processSpeedRangeControl: (event) =>
			processRangeControl(event, speedRangeControlState),
	};
}
