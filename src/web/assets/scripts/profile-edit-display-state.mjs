const METERS_PER_NM = 1852;

export function distanceDisplayState(distance) {
	const value = Number(distance);
	if (!Number.isFinite(value) || value <= 0) {
		return {
			text: "OFF",
			unitsHidden: true,
			unitsText: "",
		};
	}
	if (value < METERS_PER_NM) {
		return {
			text: Math.round(value),
			unitsHidden: false,
			unitsText: " m",
		};
	}
	return {
		text: Number((value / METERS_PER_NM).toFixed(2)),
		unitsHidden: false,
		unitsText: " NM",
	};
}

export function timeDisplayText(minutes) {
	return minutes;
}

export function speedDisplayText(speed) {
	return speed;
}

export function resetProfilesPath(_pluginId) {
	return `/signalk/v1/api/ajrmMarineDisplay/resetCollisionProfiles`;
}

export function resetProfilesRequestOptions() {
	return {
		credentials: "include",
		method: "POST",
		cache: "no-store",
	};
}

export function resetProfilesErrorMessage(status) {
	return `Factory reset failed: ${status}`;
}
