import { exposeAppWindowGlobals } from "./app-window-globals.mjs";
import { getRequiredElementByDocument } from "./app-service-factories.mjs";

export function createConfiguredRequiredElement({ window, getRequiredElement }) {
	return (
		getRequiredElement ?? ((id) => getRequiredElementByDocument(window.document, id))
	);
}

export function initializeAppServiceWindowState({
	window,
	offcanvas,
	speechControls,
	mapControls,
	autoProfileControls,
	sizeControls,
	setStationaryAutomuteSpeed,
}) {
	setStationaryAutomuteSpeed(0.35);
	exposeAppWindowGlobals({
		window,
		offcanvas,
		speechControls,
		mapControls,
		autoProfileControls,
		sizeControls,
	});
}
