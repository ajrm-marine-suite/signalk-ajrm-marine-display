import {
	AIS_PLUS_LATEST_UI_STATE_KEY,
	AIS_PLUS_UI_STATE_EVENT,
} from "./app-ui-state-publisher.mjs";
import { aisPlusAuthHeaders } from "./ais-plus-api-access.mjs";
import {
	announcementLogPath,
	clearAnnouncementLogPath,
} from "./speech-output-ui-state.mjs";
import { announcementLogUiStateProjection } from "./ui-state-projection-reader.mjs";

const DEFAULT_PLUGIN_ID = "signalk-ajrm-marine-display";
const DEFAULT_REFRESH_INTERVAL_MS = 5000;
const DEFAULT_MAX_ENTRIES = 12;

export function escapeAnnouncementLogHtml(value) {
	return String(value || "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

export function formatAnnouncementLogTimestamp(value) {
	try {
		return new Date(value).toLocaleTimeString();
	} catch {
		return String(value || "");
	}
}

export function renderAnnouncementLogEntries(
	entries,
	{ maxEntries = DEFAULT_MAX_ENTRIES } = {},
) {
	const recent = Array.isArray(entries) ? entries.slice(0, maxEntries) : [];
	if (!recent.length) {
		return '<div class="text-body-secondary">No announcements yet.</div>';
	}
	return recent
		.map(
			(entry) => `
                      <div class="list-group-item px-0">
                        <div class="d-flex justify-content-between gap-2">
                          <strong>${escapeAnnouncementLogHtml(entry.vesselName || entry.mmsi || "Target")}</strong>
                          <span class="text-body-secondary">${escapeAnnouncementLogHtml(formatAnnouncementLogTimestamp(entry.ts))} ${escapeAnnouncementLogHtml(entry.output || "")}</span>
                        </div>
                        <div class="text-body-secondary">${escapeAnnouncementLogHtml(entry.message || "")}</div>
                      </div>
                    `,
		)
		.join("");
}

export function announcementLogEntriesFromUiState(uiState) {
	const announcementLog = announcementLogUiStateProjection(uiState);
	return Array.isArray(announcementLog?.entries) ? announcementLog.entries : null;
}

export function createAnnouncementLogController({
	body,
	clearButton,
	fetchFn = globalThis.fetch,
	pluginId = DEFAULT_PLUGIN_ID,
	refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
	setIntervalFn = (callback, interval) => globalThis.setInterval(callback, interval),
	clearIntervalFn = (id) => globalThis.clearInterval(id),
	windowObject = globalThis.window,
} = {}) {
	if (!body) return null;

	let intervalId = null;
	const path = announcementLogPath(pluginId);
	const clearPath = clearAnnouncementLogPath(pluginId);

	function clearFallbackInterval() {
		if (intervalId === null) return;
		clearIntervalFn(intervalId);
		intervalId = null;
	}

	function renderFromUiState(uiState) {
		const entries = announcementLogEntriesFromUiState(uiState);
		if (!entries) return false;
		setInnerHtmlIfChanged(body, renderAnnouncementLogEntries(entries));
		return true;
	}

	function renderLatestUiState() {
		return renderFromUiState(windowObject?.[AIS_PLUS_LATEST_UI_STATE_KEY]);
	}

	function handleUiState(event) {
		if (renderFromUiState(event?.detail?.uiState)) clearFallbackInterval();
	}

	async function loadAnnouncementLog({ forceFetch = false } = {}) {
		if (!forceFetch && renderLatestUiState()) {
			clearFallbackInterval();
			return true;
		}
		try {
			const response = await fetchFn(path, {
				credentials: "include",
				cache: "no-store",
				headers: aisPlusAuthHeaders(),
			});
			if (!response.ok) return false;
			const data = await response.json();
			setInnerHtmlIfChanged(body, renderAnnouncementLogEntries(data.entries));
			return true;
		} catch {
			// Keep the plotter usable if the history endpoint is unavailable.
			return false;
		}
	}

	async function clearAnnouncementLog() {
		await fetchFn(clearPath, {
			method: "POST",
			credentials: "include",
			cache: "no-store",
			headers: aisPlusAuthHeaders(),
		});
		await loadAnnouncementLog({ forceFetch: true });
	}

	function start() {
		clearButton?.addEventListener("click", clearAnnouncementLog);
		windowObject?.addEventListener?.(AIS_PLUS_UI_STATE_EVENT, handleUiState);
		if (!renderLatestUiState()) {
			loadAnnouncementLog();
			intervalId = setIntervalFn(loadAnnouncementLog, refreshIntervalMs);
		}
		return controller;
	}

	function stop() {
		clearFallbackInterval();
		windowObject?.removeEventListener?.(AIS_PLUS_UI_STATE_EVENT, handleUiState);
	}

	const controller = {
		clearAnnouncementLog,
		loadAnnouncementLog,
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

export function startAnnouncementLog({
	documentRef = globalThis.document,
	fetchFn = globalThis.fetch,
	pluginId = DEFAULT_PLUGIN_ID,
} = {}) {
	const controller = createAnnouncementLogController({
		body: documentRef?.getElementById("announcementLogBody"),
		clearButton: documentRef?.getElementById("buttonClearAnnouncementLog"),
		fetchFn,
		pluginId,
	});
	return controller?.start() || null;
}
