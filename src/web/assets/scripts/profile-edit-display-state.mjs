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
	if (value < 1) {
		return {
			text: Math.round(value * METERS_PER_NM),
			unitsHidden: false,
			unitsText: " m",
		};
	}
	return {
		text: Number(value.toFixed(2)),
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
