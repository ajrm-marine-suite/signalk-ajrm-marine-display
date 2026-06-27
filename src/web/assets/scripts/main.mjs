// FIXME need map rotation option to toggle between north-up and cog-up

import * as L from "leaflet";
import * as protomapsL from "protomaps-leaflet";
import "leaflet-easybutton";
import defaultCollisionProfiles from "../defaultCollisionProfiles.json";
import hornMp3Url from "../horn.mp3";
import pmtilesUrl from "../ne_10m_land.pmtiles?url&no-inline";
import { escapeHtml } from "./alert-events.mjs";
import { resumeAisPlusAccessRequestPolling } from "./ais-plus-api-access.mjs";
import {
	DEFAULT_MAP_ZOOM,
	PLUGIN_ID,
} from "./app-constants.mjs";
import { createAppDom } from "./app-dom.mjs";
import { createAppRuntimeState } from "./app-runtime-state.mjs";
import { createConfiguredAppServices } from "./app-services-setup.mjs";
import { loadConfiguredStartupData } from "./app-startup-data-setup.mjs";
import { createAppTargetCollections } from "./app-target-collections.mjs";
import { createGpsStatusIndicator } from "./gps-status-indicator.mjs";
import {
	createMainDom,
	createMainServices,
	loadAndApplyMainStartupData,
	setWindowStationaryMuteThreshold,
} from "./main-core-setup.mjs";
import { createMainMapDisplayAndChartControls } from "./main-map-display-chart-setup.mjs";
import { createMainMapChartRuntime } from "./main-map-chart-setup.mjs";
import { finalizeMainStartup } from "./main-startup-finalize.mjs";
import {
	createMainTargetSupport,
	createMainTargetUi,
} from "./main-target-runtime-setup.mjs";
import { chartResourcesPath } from "./startup-data-routes.mjs";
import { createConfiguredTargetSupport } from "./target-support-setup.mjs";
import { createConfiguredTargetUi } from "./target-ui-setup.mjs";

const displayRuntimeStatus = await readDisplayRuntimeStatus();
if (displayRuntimeStatus?.enabled === false) {
	document.body.innerHTML = `
		<main class="container py-5">
			<div class="alert alert-warning">
				<h1 class="h4">AJRM Marine Display is disabled</h1>
				<p class="mb-0">Enable it in Signal K Plugin Config to use this webapp.</p>
			</div>
		</main>`;
	throw new Error("AJRM Marine Display disabled by configuration");
}

const state = createAppRuntimeState();
const targetCollections = createAppTargetCollections();
const { targets } = targetCollections;

let refreshController;
let targetMapRenderer;

setWindowStationaryMuteThreshold(window);
resumeAisPlusAccessRequestPolling();

const {
	elements,
	modals,
	offcanvas,
	speechControls,
	mapControls,
	autoProfileControls,
	sizeControls,
} = createMainDom({ createDom: createAppDom });

const { selectActiveProfile } = elements;
createGpsStatusIndicator({
	element: elements.gpsStatusIndicator,
	textElement: elements.gpsStatusText,
	windowObject: window,
}).start();

const {
	feedback,
	getHttpResponse,
	collisionProfileService,
	gpsLossPopup,
	serverAlertEvents,
	speechOutput,
	alertPopup,
	autoProfileSettings,
	profileActions,
	profileEdit,
} = createMainServices({
	window,
	dom: {
		elements,
		modals,
		offcanvas,
		speechControls,
		mapControls,
		autoProfileControls,
		sizeControls,
	},
	targets,
	state,
	defaultCollisionProfiles,
	hornMp3Url,
	escapeHtml,
	getTargetMapRenderer: () => targetMapRenderer,
	getRefreshController: () => refreshController,
	createServices: createConfiguredAppServices,
});

const {
	charts,
	initialPluginTargets,
} = await loadAndApplyMainStartupData({
	window,
	state,
	collisionProfileService,
	selectActiveProfile,
	getHttpResponse,
	autoProfileSettings,
	speechOutput,
	loadStartupData: loadConfiguredStartupData,
});

const loadCharts = () =>
	getHttpResponse(chartResourcesPath(), {
		throwErrors: false,
		ignore404: true,
		ignoreEmptyResponse: true,
	});

const { map, easyButton, autoCharts, mapFollow, baseMaps, OpenSeaMap } =
	createMainMapChartRuntime({
		L,
		protomapsL,
		pmtilesUrl,
		charts,
		state,
		defaultMapZoom: DEFAULT_MAP_ZOOM,
		loadCharts,
		storage: window.localStorage,
	});
const targetSupport = createMainTargetSupport({
	L,
	map,
	targets,
	serverAlertEvents,
	getHttpResponse,
	state,
	collisionProfileService,
	feedback,
	getTargetMapRenderer: () => targetMapRenderer,
	createTargetSupport: createConfiguredTargetSupport,
});

const { chartLayerController, harbourDisplay } =
	createMainMapDisplayAndChartControls({
	L,
	map,
	easyButton,
	offcanvas,
	document,
	baseMaps,
	OpenSeaMap,
	autoCharts,
	elements,
	mapControls,
	pluginId: PLUGIN_ID,
	getHttpResponse,
	escapeHtml,
});

const {
	targetSelection,
	targetMapRenderer: configuredTargetMapRenderer,
	refreshController: configuredRefreshController,
} = createMainTargetUi({
	map,
	collections: targetCollections,
	targetSupport,
	autoCharts,
	harbourDisplay,
	autoProfileSettings,
	speechOutput,
	serverAlertEvents,
	modals,
	offcanvas,
	elements,
	getHttpResponse,
	initialPluginTargets,
	alertPopup,
	state,
	mapControls,
	mapFollow,
	feedback,
	createTargetUi: createConfiguredTargetUi,
});
targetMapRenderer = configuredTargetMapRenderer;
refreshController = configuredRefreshController;

finalizeMainStartup({
	map,
	document,
	elements,
	window,
	offcanvas,
	autoCharts,
	autoProfileSettings,
	gpsLossPopup,
	targetSupport,
	profileEdit,
	speechOutput,
	targetSelection,
	state,
	mapFollow,
	targetMapRenderer,
	chartLayerController,
	profileActions,
	refreshController,
});

async function readDisplayRuntimeStatus() {
	try {
		const response = await fetch("/signalk/v1/api/ajrmMarineDisplay/status", {
			credentials: "include",
			cache: "no-store",
		});
		if (!response.ok) return null;
		const body = await response.json();
		return body?.status || body;
	} catch {
		return null;
	}
}
