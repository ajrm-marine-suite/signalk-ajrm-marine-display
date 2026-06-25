import {
	AIS_PLUS_LATEST_UI_STATE_KEY,
	AIS_PLUS_UI_STATE_EVENT,
} from "./app-ui-state-publisher.mjs";
import {
	panelEventsUiStateProjection,
	readFetchUiStateProjection,
} from "./ui-state-projection-reader.mjs";
import { panelEventsPath } from "./ui-state-routes.mjs";

const ALERT_PANEL_HIDDEN_KEY = "alarmMessagesHidden";
const DEFAULT_PLUGIN_ID = "signalk-ajrm-marine-display";
const DEFAULT_REFRESH_INTERVAL_MS = 1000;
const DEFAULT_SHARED_UI_STATE_MAX_AGE_MS = 2500;

export function escapeAlertPanelHtml(value) {
	return String(value || "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

export function alertPanelEntryClass(severity) {
	if (severity === "danger") return "alert-danger";
	if (severity === "info") return "alert-success";
	return "alert-warning";
}

export function normalisePanelEntries(entries) {
	if (!Array.isArray(entries)) return null;
	return entries
		.map((entry) => ({
			severity:
				entry.severity === "danger"
					? "danger"
					: entry.severity === "info"
						? "info"
						: "warning",
			message: entry.message,
		}))
		.filter((entry) => entry.message);
}

export function panelEntriesFromUiState(uiState) {
	return normalisePanelEntries(panelEventsUiStateProjection(uiState)?.entries);
}

export function alertPanelEntriesHtml(entries) {
	return entries
		.map(
			(entry, index) => `
                <div class="ais-plus-alert-item ${alertPanelEntryClass(entry.severity)}" role="listitem">
                  <span class="${index === 0 ? "fw-semibold" : ""}">${escapeAlertPanelHtml(entry.message)}</span>
                </div>
              `,
		)
		.join("");
}

export function createAlertPanelController({
	panel,
	list,
	hideButton,
	showButton,
	enabled,
	popupEnabled,
	modalAlarm,
	windowObject = globalThis.window,
	fetchFn = globalThis.fetch,
	pluginId = DEFAULT_PLUGIN_ID,
	sharedUiStateMaxAgeMs = DEFAULT_SHARED_UI_STATE_MAX_AGE_MS,
	refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
	now = () => Date.now(),
	setIntervalFn = (callback, interval) => windowObject.setInterval(callback, interval),
	clearIntervalFn = (id) => windowObject.clearInterval(id),
}) {
	if (!panel || !list || !hideButton || !showButton) return null;

	let hidden =
		windowObject?.localStorage?.getItem(ALERT_PANEL_HIDDEN_KEY) === "true";
	let lastPanelOpen = false;
	let renderInFlight = false;
	let renderQueued = false;
	let latestSharedEntries = null;
	let latestSharedEntriesAt = 0;
	let intervalId = null;

	const cacheSharedUiStatePanelEntries = (uiState) => {
		const entries = panelEntriesFromUiState(uiState);
		if (!entries) return false;
		latestSharedEntries = entries;
		latestSharedEntriesAt = now();
		return true;
	};

	const cachedPanelEntries = () =>
		latestSharedEntries &&
		now() - latestSharedEntriesAt <= sharedUiStateMaxAgeMs
			? latestSharedEntries
			: null;

	const readPanelProjection = async (url, entriesFromData) => {
		try {
			const response = await fetchFn(url, {
				credentials: "include",
				cache: "no-store",
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const data = await response.json();
			return normalisePanelEntries(entriesFromData(data));
		} catch {
			return null;
		}
	};

	const readPanelMessages = async () => {
		const cached = cachedPanelEntries();
		if (cached) return cached;
		const fromUiState = normalisePanelEntries(
			(
				await readFetchUiStateProjection({
					pluginId,
					fetchFn,
					projection: panelEventsUiStateProjection,
				})
			)?.entries,
		);
		if (fromUiState) return fromUiState;
		return (
			(await readPanelProjection(
				panelEventsPath(pluginId),
				(data) => data?.entries,
			)) || []
		);
	};

	const clearFallbackInterval = () => {
		if (intervalId === null) return;
		clearIntervalFn(intervalId);
		intervalId = null;
	};

	const dispatchResize = () => {
		const EventConstructor = windowObject?.Event || globalThis.Event;
		if (
			typeof windowObject?.dispatchEvent === "function" &&
			typeof EventConstructor === "function"
		) {
			windowObject.dispatchEvent(new EventConstructor("resize"));
		}
	};

	const setHidden = (value) => {
		hidden = value;
		windowObject?.localStorage?.setItem(ALERT_PANEL_HIDDEN_KEY, String(hidden));
		render();
	};

	async function render() {
		if (renderInFlight) {
			renderQueued = true;
			return;
		}
		renderInFlight = true;
		try {
			const enabledBySetting = enabled?.checked !== false;
			const entries = enabledBySetting ? await readPanelMessages() : [];

			const panelOpen = !hidden && entries.length > 0;
			panel.classList.toggle("d-none", !panelOpen);
			showButton.classList.toggle("d-none", !hidden || entries.length === 0);
			windowObject?.document?.body?.classList?.toggle(
				"ais-plus-alert-panel-open",
				panelOpen,
			);
			if (panelOpen !== lastPanelOpen) {
				lastPanelOpen = panelOpen;
				dispatchResize();
			}

			const hasOnlyInfoMessages = entries.every(
				(entry) => entry.severity === "info",
			);
			setTextContentIfChanged(
				showButton,
				entries.length > 1
					? `Show ${entries.length} ${hasOnlyInfoMessages ? "messages" : "alerts"}`
					: `Show ${hasOnlyInfoMessages ? "message" : "alert"}`,
			);

			setInnerHtmlIfChanged(list, alertPanelEntriesHtml(entries));
		} finally {
			renderInFlight = false;
			if (renderQueued) {
				renderQueued = false;
				render();
			}
		}
	}

	const onSharedUiState = (event) => {
		if (cacheSharedUiStatePanelEntries(event.detail?.uiState)) {
			clearFallbackInterval();
			render();
		}
	};
	const onModalAlarmShow = (event) => {
		if (popupEnabled?.checked) return;
		event.preventDefault();
		render();
	};

	function start() {
		hideButton.addEventListener("click", () => setHidden(true));
		showButton.addEventListener("click", () => setHidden(false));
		enabled?.addEventListener("change", render);
		windowObject?.addEventListener?.(AIS_PLUS_UI_STATE_EVENT, onSharedUiState);
		const hasSharedState = cacheSharedUiStatePanelEntries(
			windowObject?.[AIS_PLUS_LATEST_UI_STATE_KEY],
		);
		modalAlarm?.addEventListener("show.bs.modal", onModalAlarmShow);
		render();
		if (!hasSharedState) {
			intervalId = setIntervalFn(render, refreshIntervalMs);
		}
		return controller;
	}

	function stop() {
		clearFallbackInterval();
		windowObject?.removeEventListener?.(AIS_PLUS_UI_STATE_EVENT, onSharedUiState);
	}

	const controller = {
		cacheSharedUiStatePanelEntries,
		readPanelMessages,
		render,
		setHidden,
		start,
		stop,
	};
	return controller;
}

function setInnerHtmlIfChanged(element, html) {
	if (element._aisPlusRenderedHtml === html) return false;
	element.innerHTML = html;
	element._aisPlusRenderedHtml = html;
	return true;
}

function setTextContentIfChanged(element, text) {
	if (element._aisPlusTextContent === text) return false;
	element.textContent = text;
	element._aisPlusTextContent = text;
	return true;
}

export function startAlertPanel({
	documentRef = globalThis.document,
	windowObject = globalThis.window,
	fetchFn = globalThis.fetch,
	pluginId = DEFAULT_PLUGIN_ID,
} = {}) {
	const controller = createAlertPanelController({
		panel: documentRef?.getElementById("alarmMessagePanel"),
		list: documentRef?.getElementById("alarmMessageList"),
		hideButton: documentRef?.getElementById("buttonHideAlarmMessages"),
		showButton: documentRef?.getElementById("buttonShowAlarmMessages"),
		enabled: documentRef?.getElementById("checkShowAlertPanel"),
		popupEnabled: documentRef?.getElementById("checkShowAlarmPopup"),
		modalAlarm: documentRef?.getElementById("modalAlarm"),
		windowObject,
		fetchFn,
		pluginId,
	});
	return controller?.start() || null;
}
