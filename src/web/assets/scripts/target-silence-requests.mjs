import {
	getTargetsPath,
	setAlarmIsMutedPath,
	unsilenceAllTargetsPath,
} from "./target-silence-routes.mjs";

export function fetchTargetsForSilence({ getHttpResponse, pluginId }) {
	return getHttpResponse(getTargetsPath(pluginId), {
		throwErrors: true,
	});
}

export async function requestSilenceCurrentAlerts({ getHttpResponse, pluginId }) {
	const targets = await fetchTargetsForSilence({ getHttpResponse, pluginId });
	const selected = Object.values(targets || {}).filter(
		(target) =>
			["warning", "danger"].includes(target?.alarmState) &&
			target?.alarmIsMuted !== true,
	);
	await Promise.all(
		selected.map((target) =>
			postJson(setAlarmIsMutedPath(pluginId, target.mmsi, true), {
				silenced: true,
			}),
		),
	);
	const refreshed = await fetchTargetsForSilence({ getHttpResponse, pluginId });
	return {
		silenced: selected.length,
		targets: selected.map((target) => refreshed?.[target.mmsi] || target),
	};
}

export async function requestUnsilenceAllTargets({ getHttpResponse, pluginId }) {
	const response = await postJson(unsilenceAllTargetsPath(pluginId));
	const refreshed = await fetchTargetsForSilence({ getHttpResponse, pluginId });
	return {
		unsilenced: response?.unsilenced || 0,
		targets: Object.values(refreshed || {}),
	};
}

export async function requestSetTargetSilence({
	getHttpResponse,
	pluginId,
	mmsi,
	alarmIsMuted,
}) {
	await postJson(setAlarmIsMutedPath(pluginId, mmsi, alarmIsMuted), {
		silenced: alarmIsMuted,
	});
	const targets = await fetchTargetsForSilence({ getHttpResponse, pluginId });
	return targets?.[mmsi] || { mmsi, alarmIsMuted };
}

async function postJson(url, body) {
	const response = await fetch(url, {
		credentials: "include",
		method: "POST",
		headers: body ? { "Content-Type": "application/json" } : undefined,
		body: body ? JSON.stringify(body) : undefined,
	});
	if (!response.ok) {
		const message = await response.text();
		throw new Error(message || `${response.status} ${response.statusText}`);
	}
	return response.json();
}
