export function targetIconCacheKey({
	target = {},
	selfMmsi = "",
	selfIconVariant = "",
	selfIconFillColor = "",
	isLarge = false,
	color = "",
}) {
	const isSelf = String(target.mmsi ?? "") === String(selfMmsi ?? "");
	return [
		valueKey(target.mmsi),
		valueKey(selfMmsi),
		valueKey(target.aisClass),
		valueKey(target.name),
		valueKey(target.type),
		booleanKey(target.isAton),
		booleanKey(target.isVirtual),
		booleanKey(target.isLost),
		valueKey(target.hdg),
		valueKey(target.cog),
		valueKey(target.rot),
		booleanKey(isLarge),
		valueKey(color),
		isSelf ? valueKey(selfIconVariant) : "",
		isSelf ? valueKey(selfIconFillColor) : "",
	].join("|");
}

export function resolveCachedTargetIcon({ marker, cacheKey, createIcon }) {
	if (marker?._ajrmMarineIconCacheKey === cacheKey && marker._ajrmMarineCachedIcon) {
		return marker._ajrmMarineCachedIcon;
	}
	const icon = createIcon();
	rememberTargetIcon({ marker, cacheKey, icon });
	return icon;
}

export function rememberTargetIcon({ marker, cacheKey, icon }) {
	if (!marker) return;
	marker._ajrmMarineIconCacheKey = cacheKey;
	marker._ajrmMarineCachedIcon = icon;
}

function booleanKey(value) {
	return value === true ? "1" : "0";
}

function valueKey(value) {
	return String(value ?? "");
}
