import { createProfileEditRangeHandlers } from "./profile-edit-range-handlers.mjs";
import { createProfileEditSaveScheduler } from "./profile-edit-save-scheduler.mjs";
import { createProfileEditSensitivityController } from "./profile-edit-sensitivity-controller.mjs";
import { createProfileEditSizeController } from "./profile-edit-size-controller.mjs";

export function createProfileEditControllerRuntime({
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
}) {
	const sensitivitySave = createProfileEditSaveScheduler({
		saveProfiles,
		refresh,
	});
	const sizeController = createProfileEditSizeController({
		getProfiles,
		getNormalizedProfiles,
		sizeControls,
		normalizeVesselSizeConfig,
		setProfiles,
		saveProfiles,
	});
	const sensitivityController = createProfileEditSensitivityController({
		getNormalizedProfiles,
		sensitivityControls,
		setProfiles,
		updateSensitivityControls,
		targets,
		updateSingleVesselUI,
		sensitivitySave,
	});
	const rangeHandlers = createProfileEditRangeHandlers({
		getProfiles,
		selectedRangeCriteria,
	});

	return {
		rangeHandlers,
		sensitivityController,
		sensitivitySave,
		sizeController,
	};
}
