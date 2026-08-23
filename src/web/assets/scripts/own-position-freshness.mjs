/**
 * Defines the explicit freshness boundary shared by own-position consumers.
 */

export const DEFAULT_OWN_POSITION_MAX_AGE_MS = 30_000;

export function ownPositionAgeMs(target, { now = Date.now() } = {}) {
	const timestamp = timestampMilliseconds(target?.lastSeenDate);
	if (Number.isFinite(timestamp)) {
		return Math.max(0, Number(now) - timestamp);
	}

	if (target?.lastSeen === null || target?.lastSeen === undefined || target?.lastSeen === "") {
		return null;
	}
	const lastSeenSeconds = Number(target.lastSeen);
	return Number.isFinite(lastSeenSeconds) && lastSeenSeconds >= 0
		? lastSeenSeconds * 1000
		: null;
}

export function isOwnPositionEvidenceAged(
	target,
	{
		now = Date.now(),
		maxAgeMs = DEFAULT_OWN_POSITION_MAX_AGE_MS,
	} = {},
) {
	const maximumAge = normalizedMaximumAge(maxAgeMs);
	const age = ownPositionAgeMs(target, { now });
	return !Number.isFinite(age) || age > maximumAge;
}

export function isOwnPositionLastKnown(target, options = {}) {
	if (
		target?.isLastKnown === true ||
		target?.positionSource === "last-known" ||
		target?.isStale === true ||
		target?.isLost === true
	) {
		return true;
	}
	return isOwnPositionEvidenceAged(target, options);
}

function timestampMilliseconds(value) {
	if (value instanceof Date) return value.getTime();
	if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
	return Date.parse(value || "");
}

function normalizedMaximumAge(value) {
	const number = Number(value);
	return Number.isFinite(number) && number >= 0
		? number
		: DEFAULT_OWN_POSITION_MAX_AGE_MS;
}
