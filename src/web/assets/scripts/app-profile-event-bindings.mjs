import {
	distanceRangeControls,
	profileEventElements,
	sensitivityControls,
	sizeConfigControls,
	speedRangeControls,
	tcpaRangeControls,
} from "./app-profile-event-binding-config.mjs";
import {
	addChangeListeners,
	addInputListeners,
} from "./dom-listener-groups.mjs";

export function registerProfileEventBindings({
	document,
	controls,
	profileEdit,
	autoProfileSettings,
	offcanvasProfiles,
	offcanvasSettings,
	offcanvasEditProfiles,
	state,
	refreshProfilesFromServer,
	saveCollisionProfiles,
}) {
	const elements = profileEventElements(document);

	controls.selectActiveProfile.addEventListener("input", (ev) => {
		state.setCurrentProfile(ev.target.value);
		profileEdit.updateSensitivityControls(ev.target.value);
		saveCollisionProfiles().then(() => autoProfileSettings.refreshStatus());
	});

	elements.profilesPanel.addEventListener(
		"show.bs.offcanvas",
		refreshProfilesFromServer,
	);

	controls.buttonEditProfiles.addEventListener("click", () => {
		offcanvasProfiles.hide();
		offcanvasSettings.hide();
		controls.selectProfileToEdit.value = controls.selectActiveProfile.value;
		profileEdit.setupProfileEditView(controls.selectProfileToEdit.value);
		offcanvasEditProfiles.show();
	});

	controls.selectProfileToEdit.addEventListener("input", (ev) => {
		profileEdit.setupProfileEditView(ev.target.value);
	});

	controls.size.category.addEventListener("input", () => {
		profileEdit.setupProfileEditView(controls.selectProfileToEdit.value);
	});
	addChangeListeners(
		sizeConfigControls(controls),
		profileEdit.handleSizeConfigChange,
	);

	addInputListeners(
		sensitivityControls(controls),
		profileEdit.handleSensitivityChange,
	);
	elements.resetSensitivity.addEventListener(
		"click",
		profileEdit.resetSensitivity,
	);
	elements.saveProfile.addEventListener("click", profileEdit.saveSensitivityNow);
	elements.restoreDefaults.addEventListener(
		"click",
		profileEdit.resetProfilesToServerDefaults,
	);

	controls.offcanvasEditProfiles.addEventListener("hide.bs.offcanvas", () => {
		saveCollisionProfiles();
	});

	registerProfileRangeControlBindings({ controls, profileEdit });
}

export function registerProfileRangeControlBindings({ controls, profileEdit }) {
	addInputListeners(
		distanceRangeControls(controls),
		profileEdit.processDistanceRangeControl,
	);
	addInputListeners(
		tcpaRangeControls(controls),
		profileEdit.processTcpaRangeControl,
	);
	addInputListeners(
		speedRangeControls(controls),
		profileEdit.processSpeedRangeControl,
	);
}
