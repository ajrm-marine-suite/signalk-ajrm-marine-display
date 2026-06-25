export function createProfileActions({
	profileService,
	getProfiles,
	setProfiles,
	selectActiveProfile,
	getProfileEdit,
	autoProfileSettings,
}) {
	async function saveCollisionProfiles() {
		setProfiles(await profileService.saveProfiles(getProfiles()));
	}

	async function refreshProfilesFromServer() {
		try {
			const profiles = await profileService.refreshProfiles();
			setProfiles(profiles);
			selectActiveProfile.value = profiles.current;
			getProfileEdit()?.updateSensitivityControls(profiles.current);
			await autoProfileSettings.loadSettings();
			await autoProfileSettings.refreshStatus();
		} catch (error) {
			console.error("Error refreshing profiles", error);
		}
	}

	return {
		refreshProfilesFromServer,
		saveCollisionProfiles,
	};
}
