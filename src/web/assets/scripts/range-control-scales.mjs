const METERS_PER_NM = 1852;
const METER_DISTANCE_STEP = 25;
const LAST_METER_DISTANCE_TICK = Math.round(
	METERS_PER_NM / METER_DISTANCE_STEP,
);
const QUARTER_NM_STEP = 0.25;
const FIRST_QUARTER_NM_TICK = LAST_METER_DISTANCE_TICK + 1;
const LAST_QUARTER_NM_TICK =
	FIRST_QUARTER_NM_TICK + Math.round((5 - 1) / QUARTER_NM_STEP);
export const MAX_DISTANCE_TICK = LAST_QUARTER_NM_TICK + 5;

function nmFromMeters(meters) {
	return Number((meters / METERS_PER_NM).toFixed(6));
}

export function distanceToTick(distance) {
	const value = Number(distance);
	if (!Number.isFinite(value) || value <= 0) return 0;
	if (value < 1) {
		return Math.max(
			1,
			Math.min(
				LAST_METER_DISTANCE_TICK,
				Math.round((value * METERS_PER_NM) / METER_DISTANCE_STEP),
			),
		);
	}
	if (value <= 5) {
		return (
			FIRST_QUARTER_NM_TICK +
			Math.round((value - 1) / QUARTER_NM_STEP)
		);
	}
	return Math.min(
		MAX_DISTANCE_TICK,
		LAST_QUARTER_NM_TICK + Math.round(value - 5),
	);
}

export function tickToDistance(tick) {
	const value = Number(tick);
	if (!Number.isFinite(value) || value <= 0) return 0;
	if (value <= LAST_METER_DISTANCE_TICK) {
		return nmFromMeters(value * METER_DISTANCE_STEP);
	}
	if (value <= LAST_QUARTER_NM_TICK) {
		return Number(
			(
				1 +
				(value - FIRST_QUARTER_NM_TICK) * QUARTER_NM_STEP
			).toFixed(2),
		);
	}
	return 5 + (value - LAST_QUARTER_NM_TICK);
}

export function timeToTick(time) {
	if (time <= 5) {
		return Math.floor(time);
	} else if (time <= 20) {
		return Math.floor((time - 10) / 5 + 6);
	} else {
		return Math.floor((time - 30) / 10 + 9);
	}
}

export function tickToTime(tick) {
	if (tick <= 5) {
		return tick;
	} else if (tick <= 8) {
		return (tick - 6) * 5 + 10;
	} else {
		return (tick - 9) * 10 + 30;
	}
}

export function speedToTick(speed) {
	if (speed <= 0.5) {
		return Math.floor(speed * 10);
	} else if (speed <= 3) {
		return Math.floor(speed + 5);
	} else {
		return Math.floor(speed / 5 + 8);
	}
}

export function tickToSpeed(tick) {
	if (tick <= 5) {
		return tick / 10;
	} else if (tick <= 8) {
		return tick - 5;
	} else {
		return (tick - 8) * 5;
	}
}
