/**
 * Implements the app target collections responsibilities of the AJRM Marine Display browser application.
 */

export function createAppTargetCollections() {
	return {
		targets: new Map(),
		boatMarkers: new Map(),
		boatProjectedCourseLines: new Map(),
	};
}
