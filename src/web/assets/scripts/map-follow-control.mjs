import { recenterOnSelfTarget } from "./map-follow-action.mjs";
import { mapFollowButtonState } from "./map-follow-state.mjs";

export function createMapFollowController({
	easyButton,
	map,
	autoCharts,
	getSelfTarget,
	setDisableMoveend,
}) {
	let mapFollowSelf = true;
	let centerVesselButton;

	function updateMapFollowButton() {
		if (!centerVesselButton?.button) return;
		const state = mapFollowButtonState(mapFollowSelf);
		centerVesselButton.button.innerHTML = state.html;
		centerVesselButton.button.title = state.title;
	}

	function setMapFollowSelf(enabled) {
		mapFollowSelf = Boolean(enabled);
		updateMapFollowButton();
	}

	function getMapFollowSelf() {
		return mapFollowSelf;
	}

	centerVesselButton = easyButton(mapFollowButtonState(true).html, (_btn, buttonMap) => {
		recenterOnSelfTarget({
			map,
			buttonMap,
			autoCharts,
			getSelfTarget,
			setDisableMoveend,
			setMapFollowSelf,
		});
	}).addTo(map);
	updateMapFollowButton();

	return {
		getMapFollowSelf,
		setMapFollowSelf,
		updateMapFollowButton,
	};
}
