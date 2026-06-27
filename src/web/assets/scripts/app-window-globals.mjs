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
	window.ajrmMarineStationaryMuteThreshold = stationaryMuteThreshold;
	window.ajrmMarineProfilesOffcanvas = offcanvas.profiles;
	window.ajrmMarineSpeechControls = speechControls;
	window.ajrmMarineMapControls = mapControls;
	window.ajrmMarineAutoProfileControls = autoProfileControls;
	window.ajrmMarineSizeControls = sizeControls;
}
