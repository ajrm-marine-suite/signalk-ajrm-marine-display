import {
	mainServicesConfig,
	mainStartupDataConfig,
} from "./main-core-configs.mjs";

export {
	mainServicesConfig,
	mainServicesDomControls,
	mainStartupDataConfig,
	setWindowStationaryAutomuteSpeed,
} from "./main-core-configs.mjs";

export function createMainDom({ createDom }) {
	return createDom();
}

export function createMainServices({
	createServices,
	...configInput
}) {
	return createServices(mainServicesConfig(configInput));
}

export async function loadAndApplyMainStartupData({
	window,
	state,
	loadStartupData,
	...configInput
}) {
	const startupData = await loadStartupData(mainStartupDataConfig({
		window,
		...configInput,
	}));

	state.setCollisionProfiles(startupData.collisionProfiles);
	state.setSelfMmsi(startupData.selfMmsi);
	return startupData;
}
