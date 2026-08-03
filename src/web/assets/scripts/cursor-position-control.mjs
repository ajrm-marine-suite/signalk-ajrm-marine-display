const EARTH_RADIUS_METRES = 6371000;

export const CURSOR_POSITION_STORAGE_KEY = "checkCursorPosition";

export function createCursorPositionController({
	map,
	element,
	checkbox,
	getOwnPosition = () => null,
	storage = globalThis.localStorage,
}) {
	let enabled = storage?.getItem?.(CURSOR_POSITION_STORAGE_KEY) === "true";

	function render(event) {
		if (!enabled) return;
		const cursorPosition = leafletLatLngToPosition(event?.latlng);
		if (!cursorPosition) {
			clear();
			return;
		}
		element.textContent = `Cursor ${formatLatLon(cursorPosition)}${cursorRangeText(
			getOwnPosition(),
			cursorPosition,
		)}`;
	}

	function clear() {
		if (enabled) element.textContent = "Cursor --";
	}

	function applyEnabled(nextEnabled, { persist = true } = {}) {
		enabled = nextEnabled === true;
		checkbox.checked = enabled;
		element.classList.toggle("d-none", !enabled);
		if (!enabled) element.textContent = "Cursor --";
		if (persist) {
			storage?.setItem?.(CURSOR_POSITION_STORAGE_KEY, String(enabled));
		}
	}

	function init() {
		applyEnabled(enabled, { persist: false });
		checkbox.addEventListener("change", () => applyEnabled(checkbox.checked));
		map.on("mousemove", render);
		map.on("mouseout", clear);
	}

	return {
		init,
		setEnabled: applyEnabled,
		render,
		clear,
		isEnabled: () => enabled,
	};
}

export function formatLatLon(position) {
	const latitude = Number(position?.latitude);
	const longitude = Number(position?.longitude);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "--";
	return `${formatCoordinate(latitude, "N", "S")} ${formatCoordinate(
		longitude,
		"E",
		"W",
	)}`;
}

export function formatCoordinate(value, positive, negative) {
	const absolute = Math.abs(Number(value));
	if (!Number.isFinite(absolute)) return "n/a";
	const degrees = Math.floor(absolute);
	const minutesTotal = (absolute - degrees) * 60;
	const minutes = Math.floor(minutesTotal);
	const seconds = (minutesTotal - minutes) * 60;
	const hemisphere = Number(value) >= 0 ? positive : negative;
	return `${degrees}° ${String(minutes).padStart(2, "0")}' ${seconds.toFixed(
		1,
	)}"${hemisphere}`;
}

export function cursorRangeText(ownPosition, cursorPosition) {
	const from = targetToPosition(ownPosition);
	const to = targetToPosition(cursorPosition);
	if (!from || !to) return "";
	const distance = distanceMeters(from, to);
	const bearing = bearingDegrees(from, to);
	return ` | Range ${formatDistance(distance)} / ${formatDegrees(bearing)}`;
}

export function distanceMeters(from, to) {
	const latitude1 = radians(from.latitude);
	const latitude2 = radians(to.latitude);
	const deltaLatitude = latitude2 - latitude1;
	const deltaLongitude = radians(to.longitude - from.longitude);
	const a =
		Math.sin(deltaLatitude / 2) ** 2 +
		Math.cos(latitude1) *
			Math.cos(latitude2) *
			Math.sin(deltaLongitude / 2) ** 2;
	return 2 * EARTH_RADIUS_METRES * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function bearingDegrees(from, to) {
	const latitude1 = radians(from.latitude);
	const latitude2 = radians(to.latitude);
	const deltaLongitude = radians(to.longitude - from.longitude);
	const y = Math.sin(deltaLongitude) * Math.cos(latitude2);
	const x =
		Math.cos(latitude1) * Math.sin(latitude2) -
		Math.sin(latitude1) * Math.cos(latitude2) * Math.cos(deltaLongitude);
	return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function formatDistance(value) {
	const metres = Number(value);
	if (!Number.isFinite(metres)) return "n/a";
	if (metres < 1000) return `${Math.round(metres)} m`;
	return `${(metres / 1852).toFixed(metres < 3704 ? 1 : 0)} miles`;
}

export function formatDegrees(value) {
	const degrees = Number(value);
	return Number.isFinite(degrees) ? `${Math.round(degrees)} deg` : "n/a";
}

function leafletLatLngToPosition(latlng) {
	return targetToPosition({
		latitude: latlng?.lat,
		longitude: latlng?.lng,
	});
}

function targetToPosition(value) {
	const latitude = Number(value?.latitude);
	const longitude = Number(value?.longitude);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
	return { latitude, longitude };
}

function radians(value) {
	return (Number(value) * Math.PI) / 180;
}
