import {
	applySensitivityFromControls,
	resetProfileSensitivity,
} from "./profile-edit-state.mjs";
import {
	applyProfileSensitivityChange,
	resetProfileSensitivityChange,
} from "./profile-edit-sensitivity-actions.mjs";

export function createProfileEditSensitivityController({
	getNormalizedProfiles,
	sensitivityControls,
	setProfiles,
	updateSensitivityControls,
	targets,
	updateSingleVesselUI,
	sensitivitySave,
	applySensitivity = applySensitivityFromControls,
	resetSensitivityToDefaults = resetProfileSensitivity,
	applySensitivityChange = applyProfileSensitivityChange,
	resetSensitivityChange = resetProfileSensitivityChange,
}) {
	function handleSensitivityChange() {
		const profiles = getNormalizedProfiles();
		applySensitivityChange({
			profiles,
			sensitivityControls,
			setProfiles,
			updateSensitivityControls,
			targets,
			updateSingleVesselUI,
			applySensitivityFromControls: applySensitivity,
		});
		sensitivitySave.scheduleSave();
	}

	function resetSensitivity() {
		const profiles = getNormalizedProfiles();
		resetSensitivityChange({
			profiles,
			setProfiles,
			updateSensitivityControls,
			targets,
			updateSingleVesselUI,
			resetProfileSensitivity: resetSensitivityToDefaults,
		});
		sensitivitySave.saveNow();
	}

	return {
		handleSensitivityChange,
		resetSensitivity,
	};
}
