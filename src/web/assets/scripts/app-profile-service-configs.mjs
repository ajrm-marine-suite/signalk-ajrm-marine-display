export function autoProfileSettingsServiceConfig({
	pluginId,
	window,
	elements,
	getProfiles,
	setCurrentProfile,
	getHttpResponse,
	getProfileEdit,
}) {
	return {
		pluginId,
		controls: window.ajrmMarineAutoProfileControls,
		getCurrentProfile: () => getProfiles()?.current,
		setCurrentProfile: (profile) => {
			setCurrentProfile(profile);
			elements.selectActiveProfile.value = profile;
		},
		updateSensitivityControls: (profile) =>
			getProfileEdit()?.updateSensitivityControls(profile),
		getHttpResponse,
	};
}

export function profileActionSetServiceConfig({
	collisionProfileService,
	getProfiles,
	setProfiles,
	elements,
	getProfileEdit,
	autoProfileSettings,
}) {
	return {
		profileService: collisionProfileService,
		getProfiles,
		setProfiles,
		selectActiveProfile: elements.selectActiveProfile,
		getProfileEdit,
		autoProfileSettings,
	};
}

export function profileEditServiceConfig({
	pluginId,
	window,
	elements,
	collisionProfileService,
	profileActions,
	getProfiles,
	setProfiles,
	targets,
	getTargetMapRenderer,
	getRefreshController,
	feedback,
}) {
	return {
		elements,
		sizeControls: window.ajrmMarineSizeControls,
		profileService: collisionProfileService,
		profileActions,
		pluginId,
		getProfiles,
		setProfiles,
		targets,
		updateSingleVesselUI: (...args) =>
			getTargetMapRenderer()?.updateSingleVesselUI(...args),
		showAlert: feedback.showAlert,
		refresh: () => getRefreshController()?.refresh(),
	};
}
