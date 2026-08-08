/**
 * Implements the target overlay store responsibilities of the AJRM Marine Display browser application.
 */

export function getOrCreateStoredOverlay({ store, key, create }) {
	let overlay = store.get(key);
	if (!overlay) {
		overlay = create();
		store.set(key, overlay);
	}
	return overlay;
}
