import {
	autoProfileSettingsServiceConfig,
	profileActionSetServiceConfig,
	profileEditServiceConfig,
} from "./app-service-builder-configs.mjs";

export function createProfileEditServices({
	createAutoProfileSettings,
	createProfileActionSet,
	createProfileEdit,
	pluginId,
	window,
	elements,
	collisionProfileService,
	getProfiles,
	setProfiles,
	setCurrentProfile,
	getHttpResponse,
	targets,
	getTargetMapRenderer,
	getRefreshController,
	feedback,
}) {
	let profileEdit;
	const autoProfileSettings = createAutoProfileSettings(autoProfileSettingsServiceConfig({
		pluginId,
		window,
		elements,
		getProfiles,
		setCurrentProfile,
		getHttpResponse,
		getProfileEdit: () => profileEdit,
	}));

	const profileActions = createProfileActionSet(profileActionSetServiceConfig({
		collisionProfileService,
		getProfiles,
		setProfiles,
		elements,
		getProfileEdit: () => profileEdit,
		autoProfileSettings,
	}));

	profileEdit = createProfileEdit(profileEditServiceConfig({
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
	}));

	return {
		autoProfileSettings,
		profileActions,
		profileEdit,
	};
}
