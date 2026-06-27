import { PLUGIN_ID } from "./app-constants.mjs";

export function setWindowStationaryMuteThreshold(window, value = 0.35) {
	window.ajrmMarineStationaryMuteThreshold = value;
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
		setStationaryMuteThreshold: (value) =>
			setWindowStationaryMuteThreshold(window, value),
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
		setStationaryMuteThreshold: (value) =>
			setWindowStationaryMuteThreshold(window, value),
		autoProfileSettings,
		speechOutput,
	};
}
