const LOGIN_STATUS_URLS = ["/skServer/loginStatus", "/loginStatus"];
const ACCESS_REQUEST_URL = "/signalk/v1/access/requests";
const ACCESS_TOKEN_STORAGE_KEY = "ajrmMarine.accessToken";
const ACCESS_REQUEST_STORAGE_KEY = "ajrmMarine.accessRequestHref";
const CLIENT_ID_STORAGE_KEY = "ajrmMarine.clientId";

let accessToken = readStoredValue(ACCESS_TOKEN_STORAGE_KEY);
let accessRequestTimer = null;

export function ajrmMarineAuthHeaders(headers = {}) {
	return accessToken
		? Object.assign({}, headers, { Authorization: `Bearer ${accessToken}` })
		: headers;
}

export async function assertAisPlusResponseAllowed(response, label = "AJRM Marine") {
	if (response.ok) return;
	if (response.status === 401 && accessToken) {
		accessToken = "";
		removeStoredValue(ACCESS_TOKEN_STORAGE_KEY);
	}
	if (response.status !== 401 && response.status !== 403) return;
	const body = await readResponseBody(response);
	const loginStatus = await readLoginStatus();
	if (loginStatus && loginStatus.allowDeviceAccessRequests === true) {
		await requestSignalKAccess(label);
	}
	throw new Error(accessMessage(response.status, body, loginStatus, label));
}

export function resumeAisPlusAccessRequestPolling() {
	const pendingHref = readStoredValue(ACCESS_REQUEST_STORAGE_KEY);
	if (pendingHref) pollAccessRequest(pendingHref);
}

async function readResponseBody(response) {
	try {
		const text = await response.clone().text();
		return text ? JSON.parse(text) : {};
	} catch (_error) {
		return {};
	}
}

async function readLoginStatus() {
	for (const url of LOGIN_STATUS_URLS) {
		try {
			const response = await fetch(url, {
				cache: "no-store",
				credentials: "include",
			});
			if (response.ok) return await response.json();
		} catch (_error) {
			// Try the next Signal K login-status route.
		}
	}
	return null;
}

function accessMessage(status, body, loginStatus, label) {
	if (body?.error) return body.error;
	if (status === 403) {
		return `${label} controls require Signal K read/write or admin access.`;
	}
	if (!loginStatus || loginStatus.status !== "loggedIn") {
		return `${label} needs a Signal K login or approved device token.`;
	}
	const userLevel = loginStatus?.userLevel || "non-admin";
	return `${label} controls require Signal K read/write or admin access. Current user level: ${userLevel}.`;
}

async function requestSignalKAccess(label) {
	const pendingHref = readStoredValue(ACCESS_REQUEST_STORAGE_KEY);
	if (pendingHref) {
		pollAccessRequest(pendingHref);
		window.alert(
			`${label} needs write access. Approve the pending AJRM Marine request in Signal K Access Requests, then try again.`,
		);
		return true;
	}
	const response = await fetch(ACCESS_REQUEST_URL, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			clientId: getClientId(),
			description: "AJRM Marine browser",
			permissions: "readwrite",
		}),
	});
	const text = await response.text();
	const body = parseJson(text);
	if (!response.ok) {
		const duplicate = String(body.message || body.error || text || "").includes(
			"already requested",
		);
		if (!duplicate) {
			throw new Error(body.message || body.error || `HTTP ${response.status}`);
		}
	}
	if (body.href) {
		writeStoredValue(ACCESS_REQUEST_STORAGE_KEY, body.href);
		pollAccessRequest(body.href);
	}
	window.alert(
		`${label} needs write access. Approve AJRM Marine in Signal K Access Requests, then try again.`,
	);
	return true;
}

function pollAccessRequest(href) {
	window.clearTimeout(accessRequestTimer);
	accessRequestTimer = window.setTimeout(async () => {
		try {
			const response = await fetch(href, {
				cache: "no-store",
				credentials: "include",
			});
			const body = await response.json();
			if (body.state === "PENDING") {
				pollAccessRequest(href);
				return;
			}
			removeStoredValue(ACCESS_REQUEST_STORAGE_KEY);
			const token = body.accessRequest?.token;
			if (token) {
				accessToken = token;
				writeStoredValue(ACCESS_TOKEN_STORAGE_KEY, token);
				window.alert("AJRM Marine write access approved. Try the control again.");
				return;
			}
			window.alert("AJRM Marine write access was not approved.");
		} catch (_error) {
			pollAccessRequest(href);
		}
	}, 2000);
}

function getClientId() {
	const existing = readStoredValue(CLIENT_ID_STORAGE_KEY);
	if (existing) return existing;
	const generated = window.crypto?.randomUUID
		? window.crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(16).slice(2)}`;
	const clientId = `ajrm-marine-${generated}`;
	writeStoredValue(CLIENT_ID_STORAGE_KEY, clientId);
	return clientId;
}

function parseJson(text) {
	try {
		return text ? JSON.parse(text) : {};
	} catch (_error) {
		return {};
	}
}

function readStoredValue(key) {
	try {
		return window.localStorage.getItem(key) || "";
	} catch (_error) {
		return "";
	}
}

function writeStoredValue(key, value) {
	try {
		window.localStorage.setItem(key, value);
	} catch (_error) {
		// Ignore private browsing / locked-down storage.
	}
}

function removeStoredValue(key) {
	try {
		window.localStorage.removeItem(key);
	} catch (_error) {
		// Ignore storage failures.
	}
}
