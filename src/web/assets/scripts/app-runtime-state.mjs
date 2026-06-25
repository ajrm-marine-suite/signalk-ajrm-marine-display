export function createAppRuntimeState() {
	let collisionProfiles;
	let selfMmsi;
	let selfTarget;
	let disableMoveend = false;
	let disableMapPanTo = false;
	let selectedVesselMmsi;
	let sortTableBy = "priority";

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
	};
}
