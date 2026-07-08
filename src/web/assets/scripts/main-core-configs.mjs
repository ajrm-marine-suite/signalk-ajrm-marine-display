import { PLUGIN_ID } from "./app-constants.mjs";

export function setWindowStationaryAutomuteSpeed(window, value = 0.35) {
	window.ajrmMarineStationaryAutomuteSpeed = value;
}

export function mainServicesDomControls(dom) {
	const {
		elements,
		modals,
		offcanvas,
		speechControls,
		mapControls,
		autoProfileControls,
		sizeControls,
	} = dom;

	return {
		elements,
		modals,
		offcanvas,
		speechControls,
		mapControls,
		autoProfileControls,
		sizeControls,
	};
}

export function mainServicesConfig({
	window,
	dom,
	targets,
	state,
	defaultCollisionProfiles,
	hornMp3Url,
	escapeHtml,
	getTargetMapRenderer,
	getRefreshController,
}) {
	const controls = mainServicesDomControls(dom);

	return {
		window,
		...controls,
		pluginId: PLUGIN_ID,
		defaultCollisionProfiles,
		hornMp3Url,
		escapeHtml,
		targets,
		getSelfMmsi: state.getSelfMmsi,
		getSelfTarget: state.getSelfTarget,
		getProfiles: state.getCollisionProfiles,
		setProfiles: state.setCollisionProfiles,
		setCurrentProfile: state.setCurrentProfile,
		getTargetMapRenderer,
		getRefreshController,
		setStationaryAutomuteSpeed: (value) =>
			setWindowStationaryAutomuteSpeed(window, value),
	};
}

export function mainStartupDataConfig({
	window,
	selectActiveProfile,
	collisionProfileService,
	getHttpResponse,
	autoProfileSettings,
	speechOutput,
}) {
	return {
		pluginId: PLUGIN_ID,
		collisionProfileService,
		selectActiveProfile,
		getHttpResponse,
		speechControls: window.ajrmMarineSpeechControls,
		mapControls: window.ajrmMarineMapControls,
		setStationaryAutomuteSpeed: (value) =>
			setWindowStationaryAutomuteSpeed(window, value),
		autoProfileSettings,
		speechOutput,
	};
}
