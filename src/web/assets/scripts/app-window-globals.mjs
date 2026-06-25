export const DEFAULT_STATIONARY_MUTE_THRESHOLD = 0.35;

export function exposeAppWindowGlobals({
	window,
	offcanvas,
	speechControls,
	mapControls,
	autoProfileControls,
	sizeControls,
	stationaryMuteThreshold = DEFAULT_STATIONARY_MUTE_THRESHOLD,
}) {
	window.aisPlusStationaryMuteThreshold = stationaryMuteThreshold;
	window.aisPlusProfilesOffcanvas = offcanvas.profiles;
	window.aisPlusSpeechControls = speechControls;
	window.aisPlusMapControls = mapControls;
	window.aisPlusAutoProfileControls = autoProfileControls;
	window.aisPlusSizeControls = sizeControls;
}
