/**
 * Owns state and transitions for app runtime in the AJRM Marine Display browser application.
 */

export function createAppRuntimeState() {
	let collisionProfiles;
	let selfMmsi;
	let selfTarget;
	const selfTargetSubscribers = new Set();
	let disableMoveend = false;
	let disableMapPanTo = false;
	let selectedVesselMmsi;
	let sortTableBy = "priority";
	let coordinateFormat = "dms";

	return {
		getCollisionProfiles: () => collisionProfiles,
		setCollisionProfiles: (profiles) => {
			collisionProfiles = profiles;
		},
		setCurrentProfile: (profile) => {
			collisionProfiles.current = profile;
		},
		getSelfMmsi: () => selfMmsi,
		setSelfMmsi: (mmsi) => {
			selfMmsi = mmsi;
		},
		getSelfTarget: () => selfTarget,
		setSelfTarget: (target) => {
			selfTarget = target;
			for (const subscriber of [...selfTargetSubscribers]) {
				try {
					subscriber(target);
				} catch (error) {
					console.error("Self-target subscriber failed:", error);
				}
			}
		},
		subscribeSelfTarget: (subscriber) => {
			if (typeof subscriber !== "function") {
				throw new TypeError("Self-target subscriber must be a function");
			}
			selfTargetSubscribers.add(subscriber);
			return () => selfTargetSubscribers.delete(subscriber);
		},
		getDisableMoveend: () => disableMoveend,
		setDisableMoveend: (value) => {
			disableMoveend = value;
		},
		getDisableMapPanTo: () => disableMapPanTo,
		setDisableMapPanTo: (value) => {
			disableMapPanTo = value;
		},
		getSelectedVesselMmsi: () => selectedVesselMmsi,
		setSelectedVesselMmsi: (mmsi) => {
			selectedVesselMmsi = mmsi;
		},
		getSortTableBy: () => sortTableBy,
		setSortTableBy: (value) => {
			sortTableBy = value;
		},
		getCoordinateFormat: () => coordinateFormat,
		setCoordinateFormat: (value) => {
			coordinateFormat = value;
		},
	};
}
