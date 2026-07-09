import { refreshMapViewForSelfTarget } from "./target-map-view-refresh.mjs";
import { renderRendererTargetCounts } from "./target-map-renderer-actions.mjs";
import { displayDebugControls } from "./display-debug-controls.mjs";

export function updateRendererUi({
	selfTarget,
	map,
	shouldFollow,
	disableMapPanTo,
	setDisableMoveend,
	drawRangeRings,
	autoCharts,
	updateHarbourDisplay,
	autoProfileSettings,
	collisionProfiles,
	targets,
	selectedVesselMmsi,
	updateSingleVesselUI,
	updateSelectedVesselProperties,
	labelCollision,
	updateTableOfTargets,
	speechOutput,
	serverAlertEvents,
	uiState,
	allowServerFallbackRefresh = true,
	countState,
	countElements,
	refreshMapView = refreshMapViewForSelfTarget,
	renderTargetCounts = renderRendererTargetCounts,
}) {
	const debugControls = displayDebugControls();
	refreshMapView({
		selfTarget,
		map,
		shouldFollow,
		disableMapPanTo,
		setDisableMoveend,
		drawRangeRings,
		autoCharts,
		updateHarbourDisplay,
		debugControls,
	});

	const autoProfileStatusApplied =
		autoProfileSettings.refreshStatusFromUiState?.(uiState) === true;
	if (!autoProfileStatusApplied && allowServerFallbackRefresh) {
		autoProfileSettings.refreshStatus?.();
	}
	targets.forEach((target) => {
		updateSingleVesselUI(target, {
			collisionProfiles,
			deferLabelCollision: disableMapPanTo,
			deferMapOverlays: disableMapPanTo,
		});
		if (!disableMapPanTo && target.mmsi === selectedVesselMmsi) {
			updateSelectedVesselProperties(target);
		}
	});

	if (!disableMapPanTo && debugControls.labels) {
		labelCollision.update();
	}
	if (!disableMapPanTo && debugControls.targetTable) {
		updateTableOfTargets();
	}
	const browserSpeechHasFreshServerState =
		validUiStateObject(uiState) || allowServerFallbackRefresh;
	const updateSpeechOutput = () => {
		speechOutput.refreshMuteStatus();
		if (browserSpeechHasFreshServerState) {
			speechOutput.speakBrowserAlerts(serverAlertEvents.getEvents(), {
				uiState,
				allowFetchFallback: allowServerFallbackRefresh,
			});
		}
	};
	const uiStateSettingsApplied =
		speechOutput.refreshSettingsFromUiState?.(uiState) === true;
	const settingsRefresh =
		uiStateSettingsApplied || !allowServerFallbackRefresh
			? null
			: speechOutput.refreshSettingsFromServer?.();
	if (settingsRefresh && typeof settingsRefresh.then === "function") {
		settingsRefresh.then(updateSpeechOutput, updateSpeechOutput);
	} else {
		updateSpeechOutput();
	}

	renderTargetCounts({ countState, countElements });
}

function validUiStateObject(uiState) {
	return !!uiState && typeof uiState === "object" && !Array.isArray(uiState);
}
