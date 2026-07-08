export const DEFAULT_STATIONARY_AUTOMUTE_SPEED = 0.35;

export function exposeAppWindowGlobals({
	window,
	offcanvas,
	speechControls,
	mapControls,
	autoProfileControls,
	sizeControls,
	stationaryAutomuteSpeed = DEFAULT_STATIONARY_AUTOMUTE_SPEED,
}) {
	window.ajrmMarineStationaryAutomuteSpeed = stationaryAutomuteSpeed;
	window.ajrmMarineProfilesOffcanvas = offcanvas.profiles;
	window.ajrmMarineSpeechControls = speechControls;
	window.ajrmMarineMapControls = mapControls;
	window.ajrmMarineAutoProfileControls = autoProfileControls;
	window.ajrmMarineSizeControls = sizeControls;
}
