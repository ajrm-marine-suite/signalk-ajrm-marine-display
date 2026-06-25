export const DARK_MAP_FILTER =
	"invert(1) hue-rotate(180deg) brightness(0.8) contrast(1.2)";

export function colorModeState(darkModeEnabled) {
	return {
		theme: darkModeEnabled ? "dark" : "light",
		mapFilter: darkModeEnabled ? DARK_MAP_FILTER : "none",
	};
}

export function storedCheckboxValue(storage, key) {
	return storage.getItem(key) === "true";
}

export function fullscreenChecked(fullscreenElement) {
	return Boolean(fullscreenElement);
}
