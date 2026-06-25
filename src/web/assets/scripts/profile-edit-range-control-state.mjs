import {
	tickToDistance,
	tickToSpeed,
	tickToTime,
} from "./range-control-scales.mjs";
import {
	distanceDisplayState,
	speedDisplayText,
	timeDisplayText,
} from "./profile-edit-display-state.mjs";

export function distanceRangeControlState({ tick, dataset, criteria }) {
	const distance = tickToDistance(tick);
	criteria[dataset.alarmCriteria] = distance;
	return {
		target: dataset.target,
		unitsTarget: `${dataset.target}Units`,
		...distanceDisplayState(distance),
	};
}

export function tcpaRangeControlState({ tick, dataset, criteria }) {
	const time = tickToTime(tick);
	criteria[dataset.alarmCriteria] = time * 60;
	return {
		target: dataset.target,
		text: timeDisplayText(time),
	};
}

export function speedRangeControlState({ tick, dataset, criteria }) {
	const speed = tickToSpeed(tick);
	criteria[dataset.alarmCriteria] = speed;
	return {
		target: dataset.target,
		text: speedDisplayText(speed),
	};
}
