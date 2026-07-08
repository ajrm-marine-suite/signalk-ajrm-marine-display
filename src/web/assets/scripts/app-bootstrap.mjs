export async function bootstrapApp({
	pluginId,
	collisionProfileService,
	selectActiveProfile,
	loadInitialAppSettings,
	getHttpResponse,
	speechControls,
	mapControls,
	setStationaryAutomuteSpeed,
	autoProfileSettings,
	speechOutput,
	loadStartupData,
}) {
	const collisionProfiles = await collisionProfileService.loadProfiles();
	selectActiveProfile.value = collisionProfiles.current;

	await loadInitialAppSettings({
		pluginId,
		getHttpResponse,
		speechControls,
		mapControls,
		setStationaryAutomuteSpeed,
	});
	await autoProfileSettings.loadSettings();
	speechOutput.updateMuteStatus();

	const startupData = await loadStartupData({ pluginId, getHttpResponse });
	return {
		collisionProfiles,
		...startupData,
	};
}
