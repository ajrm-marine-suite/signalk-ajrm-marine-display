/**
 * Binds events for checkbox storage in the AJRM Marine Display browser application.
 */

export function bindCheckboxStorage({ control, key, storage, afterChange }) {
	control.addEventListener("change", () => {
		storage.setItem(key, control.checked);
		if (afterChange) afterChange();
	});
}
