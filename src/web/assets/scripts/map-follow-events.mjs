import { shouldPauseFollowAfterMove } from "./map-follow-movement-decision.mjs";
import { displayDebugControls } from "./display-debug-controls.mjs";

export {
	mapCentersEqual,
	shouldPauseFollowAfterMove,
} from "./map-follow-movement-decision.mjs";

export function registerMapFollowMoveEvents({
	map,
	state,
	autoCharts,
	drawRangeRings,
	labelCollision,
	schedule = scheduleFrame,
}) {
	let moveStartCenter = null;
	let moveStartZoom = null;
	let autoChartUpdateScheduled = false;

	function scheduleAutoChartUpdate() {
		if (autoChartUpdateScheduled) return;
		autoChartUpdateScheduled = true;
		schedule(() => {
			autoChartUpdateScheduled = false;
			autoCharts.update();
		});
	}

	map.on("movestart", () => {
		moveStartCenter = map.getCenter?.() || null;
		moveStartZoom = map.getZoom?.() ?? null;
		state.setDisableMapPanTo(true);
	});

	map.on("moveend", () => {
		const moveEndCenter = map.getCenter?.() || null;
		const moveEndZoom = map.getZoom?.() ?? null;
		const disableMoveend = state.getDisableMoveend();
		state.setDisableMapPanTo(false);
		if (disableMoveend) {
			moveStartCenter = null;
			moveStartZoom = null;
			return;
		}
		if (
			shouldPauseFollowAfterMove({
				moveStartCenter,
				moveEndCenter,
				moveStartZoom,
				moveEndZoom,
				disableMoveend,
				selfTarget: state.getSelfTarget(),
			})
		) {
			state.setMapFollowSelf(false);
		}
		moveStartCenter = null;
		moveStartZoom = null;
		scheduleAutoChartUpdate();
	});

	map.on("zoomend", () => {
		drawRangeRings({ enabled: displayDebugControls().rangeRings !== false });
		labelCollision.update();
		scheduleAutoChartUpdate();
	});
}

function scheduleFrame(callback) {
	const requestFrame = globalThis.requestAnimationFrame;
	if (typeof requestFrame === "function") {
		requestFrame(callback);
		return;
	}
	setTimeout(callback, 0);
}
