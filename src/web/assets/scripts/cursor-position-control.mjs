import {
	COORDINATE_FORMAT_STORAGE_KEY,
	formatLatLon,
	normalizeCoordinateFormat,
} from "./coordinate-format.mjs";

export { formatCoordinate, formatLatLon } from "./coordinate-format.mjs";

const EARTH_RADIUS_METRES = 6371000;

export const CURSOR_POSITION_STORAGE_KEY = "checkCursorPosition";

export function createCursorPositionController({
	map,
	element,
	checkbox,
	formatSelect,
	defaultCoordinateFormat = "dms",
	onCoordinateFormatChanged = () => {},
	getOwnPosition = () => null,
	storage = globalThis.localStorage,
}) {
	let enabled = storage?.getItem?.(CURSOR_POSITION_STORAGE_KEY) === "true";
	let lastEvent = null;
	let coordinateFormat = normalizeCoordinateFormat(
		storage?.getItem?.(COORDINATE_FORMAT_STORAGE_KEY),
		defaultCoordinateFormat,
	);

	function render(event) {
		lastEvent = event;
		if (!enabled) return;
		const cursorPosition = leafletLatLngToPosition(event?.latlng);
		if (!cursorPosition) {
			clear();
			return;
		}
		element.textContent = `Cursor ${formatLatLon(cursorPosition, coordinateFormat)}${cursorRangeText(
			getOwnPosition(),
			cursorPosition,
		)}`;
	}

	function applyCoordinateFormat(value, { persist = true } = {}) {
		coordinateFormat = normalizeCoordinateFormat(value, defaultCoordinateFormat);
		if (formatSelect) formatSelect.value = coordinateFormat;
		if (persist) {
			storage?.setItem?.(COORDINATE_FORMAT_STORAGE_KEY, coordinateFormat);
		}
		onCoordinateFormatChanged(coordinateFormat);
		if (lastEvent) render(lastEvent);
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
		applyCoordinateFormat(coordinateFormat, { persist: false });
		checkbox.addEventListener("change", () => applyEnabled(checkbox.checked));
		formatSelect?.addEventListener("change", () =>
			applyCoordinateFormat(formatSelect.value),
		);
		map.on("mousemove", render);
		map.on("mouseout", clear);
	}

	return {
		init,
		setEnabled: applyEnabled,
		render,
		clear,
		isEnabled: () => enabled,
		getCoordinateFormat: () => coordinateFormat,
		setCoordinateFormat: applyCoordinateFormat,
	};
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
