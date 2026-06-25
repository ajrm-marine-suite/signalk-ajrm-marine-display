import { createProfileEditControllerRuntime } from "./profile-edit-controller-runtime.mjs";
import { resetProfilesToServerDefaults as resetProfilesToServerDefaultsAction } from "./profile-edit-reset-defaults.mjs";
import {
	normalizeProfilesForEdit,
	selectedControllerRangeCriteria,
	setupControllerProfileEditView,
	updateControllerSensitivityControls,
} from "./profile-edit-controller-state.mjs";

export function createProfileEditController({
	controls,
	sizeControls,
	sensitivityControls,
	pluginId,
	getProfiles,
	setProfiles,
	normalizeCollisionProfiles,
	normalizeVesselSizeConfig,
	saveProfiles,
	targets,
	updateSingleVesselUI,
	showAlert,
	refresh,
}) {
	function selectedRangeCriteria(profiles, dataset) {
		return selectedControllerRangeCriteria({
			profiles,
			profileName: controls.selectProfileToEdit.value,
			dataset,
			sizeControls,
		});
	}

	function getNormalizedProfiles() {
		return normalizeProfilesForEdit({
			getProfiles,
			setProfiles,
			normalizeCollisionProfiles,
		});
	}

	function setupProfileEditView(profile) {
		const profiles = getNormalizedProfiles();
		sizeController.updateControls();
		setupControllerProfileEditView({
			controls,
			sizeControls,
			profiles,
			profileName: profile,
		});
	}

	function updateSensitivityControls(profileName) {
		const profile = getProfiles()?.[profileName];
		updateControllerSensitivityControls({
			profile,
			sensitivityControls,
		});
	}

	const runtime = createProfileEditControllerRuntime({
		getProfiles,
		getNormalizedProfiles,
		selectedRangeCriteria,
		sizeControls,
		sensitivityControls,
		normalizeVesselSizeConfig,
		setProfiles,
		saveProfiles,
		refresh,
		targets,
		updateSingleVesselUI,
		updateSensitivityControls,
	});
	const {
		rangeHandlers: {
			processDistanceRangeControl,
			processTcpaRangeControl,
			processSpeedRangeControl,
		},
		sensitivityController,
		sensitivitySave,
		sizeController,
	} = runtime;

	async function resetProfilesToServerDefaults() {
		await resetProfilesToServerDefaultsAction({
			pluginId,
			controls,
			normalizeCollisionProfiles,
			setProfiles,
			setupProfileEditView,
			updateSensitivityControls,
			showAlert,
			refresh,
		});
	}

	return {
		handleSensitivityChange: sensitivityController.handleSensitivityChange,
		handleSizeConfigChange: sizeController.handleChange,
		processDistanceRangeControl,
		processSpeedRangeControl,
		processTcpaRangeControl,
		resetProfilesToServerDefaults,
		resetSensitivity: sensitivityController.resetSensitivity,
		saveSensitivityNow: sensitivitySave.saveNow,
		setupProfileEditView,
		updateSensitivityControls,
	};
}
