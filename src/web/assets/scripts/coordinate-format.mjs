export const COORDINATE_FORMAT_STORAGE_KEY =
	"ajrmMarineDisplayCoordinateFormat";

export const COORDINATE_FORMATS = new Set([
	"dms",
	"degrees-minutes",
	"decimal",
]);

export function normalizeCoordinateFormat(value, fallback = "dms") {
	const candidate = String(value || "").trim().toLowerCase();
	if (COORDINATE_FORMATS.has(candidate)) return candidate;
	const normalizedFallback = String(fallback || "").trim().toLowerCase();
	return COORDINATE_FORMATS.has(normalizedFallback)
		? normalizedFallback
		: "dms";
}

export function formatLatLon(position, format = "dms") {
	const latitude = Number(position?.latitude);
	const longitude = Number(position?.longitude);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "--";
	return `${formatCoordinate(latitude, "N", "S", format)} ${formatCoordinate(
		longitude,
		"E",
		"W",
		format,
	)}`;
}

export function formatCoordinate(
	value,
	positive,
	negative,
	format = "dms",
) {
	const number = Number(value);
	const absolute = Math.abs(number);
	if (!Number.isFinite(absolute)) return "---";
	const hemisphere = number >= 0 ? positive : negative;
	const normalizedFormat = normalizeCoordinateFormat(format);
	if (normalizedFormat === "decimal") {
		return `${absolute.toFixed(6)}°${hemisphere}`;
	}
	const degrees = Math.floor(absolute);
	const minutesTotal = (absolute - degrees) * 60;
	if (normalizedFormat === "degrees-minutes") {
		return `${degrees}° ${minutesTotal.toFixed(3)}'${hemisphere}`;
	}
	const minutes = Math.floor(minutesTotal);
	const seconds = (minutesTotal - minutes) * 60;
	return `${degrees}° ${String(minutes).padStart(2, "0")}' ${seconds.toFixed(
		1,
	)}"${hemisphere}`;
}
