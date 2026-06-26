import {
	AIS_PLUS_LATEST_UI_STATE_KEY,
} from "./app-ui-state-publisher.mjs";
import { aisPlusAuthHeaders } from "./ais-plus-api-access.mjs";
import { refreshCollisionProfilesPath } from "./collision-profile-routes.mjs";
import { autoProfileStatusUiStateProjection } from "./ui-state-projection-reader.mjs";
import { uiStatePath } from "./ui-state-routes.mjs";

const DEFAULT_PLUGIN_ID = "signalk-ajrm-marine-display";

const profileLabels = {
	anchor: "Anchored",
	harbor: "Harbour",
	coastal: "Coastal",
	offshore: "Offshore",
};
const sizeLabels = { small: "Small", medium: "Medium", large: "Large" };
const alarmLabels = { alert: "Watch", warning: "Advisory", danger: "Alarm" };

export function helpSettingsRepeatIntervalsPath(_pluginId, timestamp = Date.now()) {
	return `/signalk/v1/api/ajrmMarineDisplay/repeatIntervals?ts=${timestamp}`;
}

export function escapeHelpSettingsHtml(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

export function finiteHelpSettingsNumber(value, fallback = 0) {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatHelpSettingsMinutes(seconds) {
	const value = Math.round(finiteHelpSettingsNumber(seconds) / 60);
	return value > 0 ? `${value} min` : "Off";
}

export function formatHelpSettingsDuration(seconds) {
	const value = Math.round(finiteHelpSettingsNumber(seconds));
	if (value <= 0) return "Off";
	if (value < 60) return `${value} sec`;
	const minutes = Math.round(value / 60);
	return `${minutes} min`;
}

export function formatHelpSettingsSpeed(knots) {
	const value = finiteHelpSettingsNumber(knots);
	return value > 0 ? `${Number(value.toFixed(1))} kn` : "Off";
}

export function formatHelpSettingsDistanceNm(nm) {
	const value = finiteHelpSettingsNumber(nm);
	if (value <= 0) return "Off";
	if (value < 1) return `${Math.round(value * 1852)} m`;
	return `${Number(value.toFixed(2))} NM`;
}

export function formatHelpSettingsMeters(meters) {
	const value = finiteHelpSettingsNumber(meters);
	return value > 0 ? `${Math.round(value)} m` : "Off";
}

export function criteriaForHelpSettingsSize(criteria, size) {
	const fallback = {
		cpa: finiteHelpSettingsNumber(criteria?.cpa),
		tcpa: finiteHelpSettingsNumber(criteria?.tcpa),
		speed: finiteHelpSettingsNumber(criteria?.speed),
	};
	return { ...fallback, ...(criteria?.bySize?.[size] || {}) };
}

export function repeatWithHelpSettingsSensitivity(seconds, sensitivity) {
	const repeatSensitivity = finiteHelpSettingsNumber(sensitivity, 1);
	if (repeatSensitivity <= 0) return 0;
	return finiteHelpSettingsNumber(seconds) / repeatSensitivity;
}

export function autoProfileStatusFromSharedUiState(windowObject) {
	return autoProfileStatusUiStateProjection(
		windowObject?.[AIS_PLUS_LATEST_UI_STATE_KEY],
	);
}

export function renderHelpSettingsHtml(
	profiles = {},
	autoProfileStatus,
	repeatIntervals = {},
) {
	const activeProfile = profiles.current || "harbor";
	const vesselSize = profiles.vesselSize || {};
	const profileRows = [];

	for (const profileKey of ["anchor", "harbor", "coastal", "offshore"]) {
		const profile = profiles[profileKey] || {};
		const cpaSensitivity = finiteHelpSettingsNumber(profile.cpaSensitivity, 1);
		const tcpaLookahead = finiteHelpSettingsNumber(profile.tcpaLookahead, 1);
		const repeatSensitivity = finiteHelpSettingsNumber(
			profile.repeatSensitivity,
			1,
		);

		profileRows.push(`
              <tr${profileKey === activeProfile ? ' class="table-active"' : ""}>
                <td>${escapeHelpSettingsHtml(profileLabels[profileKey] || profileKey)}</td>
                <td>All</td>
                <td>${escapeHelpSettingsHtml(alarmLabels.alert)}</td>
                <td>-</td>
                <td>-</td>
                <td>${escapeHelpSettingsHtml(formatHelpSettingsDuration(repeatWithHelpSettingsSensitivity(repeatIntervals.alert, repeatSensitivity)))}</td>
                <td>-</td>
              </tr>
            `);

		for (const size of ["small", "medium", "large"]) {
			for (const alarmType of ["warning", "danger"]) {
				const criteria = criteriaForHelpSettingsSize(profile[alarmType], size);
				const repeatText =
					alarmType === "warning"
						? `Advisory ${formatHelpSettingsDuration(repeatWithHelpSettingsSensitivity(repeatIntervals.warning, repeatSensitivity))}`
						: `Alarm ${formatHelpSettingsDuration(repeatWithHelpSettingsSensitivity(repeatIntervals.alarm, repeatSensitivity))}; emergency ${formatHelpSettingsDuration(repeatWithHelpSettingsSensitivity(repeatIntervals.emergency, repeatSensitivity))}`;
				profileRows.push(`
                  <tr${profileKey === activeProfile ? ' class="table-active"' : ""}>
                    <td>${escapeHelpSettingsHtml(profileLabels[profileKey] || profileKey)}</td>
                    <td>${escapeHelpSettingsHtml(sizeLabels[size])}</td>
                    <td>${escapeHelpSettingsHtml(alarmLabels[alarmType])}</td>
                    <td>${escapeHelpSettingsHtml(formatHelpSettingsDistanceNm(finiteHelpSettingsNumber(criteria.cpa) * cpaSensitivity))}</td>
                    <td>${escapeHelpSettingsHtml(formatHelpSettingsMinutes(finiteHelpSettingsNumber(criteria.tcpa) * tcpaLookahead))}</td>
                    <td>${escapeHelpSettingsHtml(repeatText)}</td>
                    <td>${escapeHelpSettingsHtml(formatHelpSettingsSpeed(criteria.speed))}</td>
                  </tr>
                `);
			}
		}
	}

	return `
            <div class="row g-3 mb-3">
              <div class="col-md-6">
                <div class="border rounded p-3 h-100">
                  <h6>Active Profile</h6>
                  <dl class="row mb-0 small">
                    <dt class="col-6">Current</dt>
                    <dd class="col-6">${escapeHelpSettingsHtml(profileLabels[activeProfile] || activeProfile)}</dd>
                    <dt class="col-6">Auto Profile Switch</dt>
                    <dd class="col-6">${autoProfileStatus?.options?.enabled === false ? "Off" : "On"}</dd>
                    <dt class="col-6">Auto message</dt>
                    <dd class="col-6">${escapeHelpSettingsHtml(autoProfileStatus?.message || "No status")}</dd>
                  </dl>
                </div>
              </div>
              <div class="col-md-6">
                <div class="border rounded p-3 h-100">
                  <h6>Vessel Size Categories</h6>
                  <dl class="row mb-0 small">
                    <dt class="col-6">Small up to</dt>
                    <dd class="col-6">${escapeHelpSettingsHtml(formatHelpSettingsMeters(vesselSize.smallMaxLengthMeters))}</dd>
                    <dt class="col-6">Medium up to</dt>
                    <dd class="col-6">${escapeHelpSettingsHtml(formatHelpSettingsMeters(vesselSize.mediumMaxLengthMeters))}</dd>
                    <dt class="col-6">Unknown length</dt>
                    <dd class="col-6">${escapeHelpSettingsHtml(sizeLabels[vesselSize.unknownLengthCategory] || vesselSize.unknownLengthCategory || "Small")}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <h6>CPA and TCPA Limits</h6>
            <div class="table-responsive ais-plus-help-table-scroll mb-3">
              <table class="table table-sm table-striped align-middle small">
                <thead>
                  <tr>
                    <th>Profile</th>
                    <th>Vessel</th>
                    <th>Level</th>
                    <th>CPA</th>
                    <th>TCPA</th>
                    <th>Repeat interval</th>
                    <th>Ignore below</th>
                  </tr>
                </thead>
                <tbody>${profileRows.join("")}</tbody>
              </table>
            </div>
          `;
}

async function readJson(fetchFn, url, { requiredLabel } = {}) {
	const response = await fetchFn(url, {
		credentials: "include",
		cache: "no-store",
		headers: aisPlusAuthHeaders(),
	});
	if (!response.ok) {
		if (requiredLabel) {
			throw new Error(`${requiredLabel} request failed: ${response.status}`);
		}
		return null;
	}
	return response.json();
}

export async function readHelpSettingsAutoProfileStatus({
	fetchFn,
	pluginId = DEFAULT_PLUGIN_ID,
	windowObject = globalThis.window,
}) {
	const shared = autoProfileStatusFromSharedUiState(windowObject);
	if (shared) return shared;
	const uiState = await readJson(fetchFn, uiStatePath(pluginId));
	return autoProfileStatusUiStateProjection(uiState);
}

export function createHelpSettingsController({
	modal,
	refreshButton,
	status,
	content,
	currentSettingsTab,
	fetchFn = globalThis.fetch,
	windowObject = globalThis.window,
	pluginId = DEFAULT_PLUGIN_ID,
	now = () => Date.now(),
}) {
	if (!modal || !status || !content) return null;

	async function loadHelpSettings() {
		status.textContent = "Loading...";
		try {
			const timestamp = now();
			const [profiles, autoProfileStatus, repeatIntervals] = await Promise.all([
				readJson(fetchFn, refreshCollisionProfilesPath(pluginId, timestamp), {
					requiredLabel: "Profiles",
				}),
				readHelpSettingsAutoProfileStatus({ fetchFn, pluginId, windowObject }),
				readJson(fetchFn, helpSettingsRepeatIntervalsPath(pluginId, timestamp)),
			]);
			content.innerHTML = renderHelpSettingsHtml(
				profiles,
				autoProfileStatus,
				repeatIntervals || {},
			);
			status.textContent = `Updated ${new Date(now()).toLocaleTimeString()}`;
		} catch (error) {
			content.innerHTML = "";
			status.textContent = `Unable to load current settings: ${error.message}`;
		}
	}

	function start() {
		modal.addEventListener("show.bs.modal", loadHelpSettings);
		currentSettingsTab?.addEventListener("shown.bs.tab", loadHelpSettings);
		refreshButton?.addEventListener("click", loadHelpSettings);
		return controller;
	}

	const controller = { loadHelpSettings, start };
	return controller;
}

export function startHelpSettings({
	documentRef = globalThis.document,
	windowObject = globalThis.window,
	fetchFn = globalThis.fetch,
	pluginId = DEFAULT_PLUGIN_ID,
} = {}) {
	const controller = createHelpSettingsController({
		modal: documentRef?.getElementById("modalHelp"),
		refreshButton: documentRef?.getElementById("buttonRefreshHelpSettings"),
		status: documentRef?.getElementById("helpSettingsStatus"),
		content: documentRef?.getElementById("helpSettingsContent"),
		currentSettingsTab: documentRef?.getElementById("help-current-settings-tab"),
		windowObject,
		fetchFn,
		pluginId,
	});
	return controller?.start() || null;
}
