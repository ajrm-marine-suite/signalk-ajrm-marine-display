/**
 * Coordinates route in the AJRM Marine Display browser application.
 */

import {
	activeRouteFingerprint,
	normalizeRouteStyle,
	routeArrowSegments,
	routeLatLngs,
	routeSummary,
} from "./route-rendering.mjs";

const API_BASE = "/signalk/v1/api/ajrmMarineDisplay/routes";
const ROUTE_COLOR_KEY = "ajrmMarineDisplay.route.color";
const ROUTE_WIDTH_KEY = "ajrmMarineDisplay.route.width";
const LAST_BROWSER_FILE_KEY = "ajrmMarineDisplay.route.lastBrowserFile";

export function createRouteController({
	L,
	map,
	controls,
	styleControls,
	fetchFn = globalThis.fetch,
	storage = globalThis.localStorage,
	setIntervalFn = globalThis.setInterval,
	confirmFn = globalThis.confirm,
} = {}) {
	const layer = L.layerGroup().addTo(map);
	let active = null;
	let fingerprint = "none";
	let busy = false;

	function init() {
		applyStoredStyle();
		bindEvents();
		refresh({ fit: false });
		setIntervalFn(() => refresh({ fit: false }), 5000);
	}

	function bindEvents() {
		controls.modal.addEventListener("show.bs.modal", () => refresh({ fit: false }));
		controls.openPi.addEventListener("click", () => action("open-pi", {
			fileName: controls.piFile.value,
		}, "Opening route from the Pi…"));
		controls.openResource.addEventListener("click", () => action("open-resource", {
			id: controls.resource.value,
		}, "Opening Signal K route…"));
		controls.deleteResource.addEventListener("click", deleteSignalKResource);
		controls.openBrowser.addEventListener("click", importBrowserFile);
		controls.reverse.addEventListener("change", () => action("reverse", {}, "Reversing route…"));
		controls.save.addEventListener("click", () => save(false));
		controls.saveAs.addEventListener("click", () => save(true));
		controls.close.addEventListener("click", () => action("close", {}, "Closing route…"));
		controls.browserFile.addEventListener("change", rememberBrowserFile);
		styleControls.color.addEventListener("change", updateStyle);
		styleControls.width.addEventListener("input", updateStyle);
	}

	async function refresh({ fit = false } = {}) {
		if (busy) return;
		try {
			const response = await request("", { method: "GET" });
			populateLists(response);
			applyActive(response.active, { fit });
			controls.piDirectory.textContent = response.routeDirectory
				? `GPX folder: ${response.routeDirectory}`
				: "GPX folder unavailable";
		} catch (error) {
			setStatus(error.message, true);
		}
	}

	async function action(name, body, message) {
		if (busy) return;
		setBusy(true, message);
		try {
			const response = await request(`/${name}`, {
				method: "POST",
				body: JSON.stringify(body),
			});
			applyActive(response.active, { fit: name.startsWith("open") });
			await refresh({ fit: false });
			setStatus(response.active ? `${response.active.resource.name} is open.` : "Route closed.");
		} catch (error) {
			controls.reverse.checked = active?.reversed === true;
			setStatus(error.message, true);
		} finally {
			setBusy(false);
		}
	}

	async function importBrowserFile() {
		const file = controls.browserFile.files?.[0];
		if (!file) {
			setStatus("Choose a GPX file first.", true);
			return;
		}
		setBusy(true, "Reading GPX file…");
		try {
			const gpx = await file.text();
			const response = await request("/import", {
				method: "POST",
				body: JSON.stringify({
					gpx,
					fileName: file.name,
					routeIndex: 0,
					saveToPi: controls.saveImportedToPi.checked,
				}),
			});
			storage?.setItem?.(LAST_BROWSER_FILE_KEY, file.name);
			applyActive(response.active, { fit: true });
			await refresh({ fit: false });
			setStatus(`${response.active.resource.name} imported and opened.`);
		} catch (error) {
			setStatus(error.message, true);
		} finally {
			setBusy(false);
		}
	}

	function save(saveAs) {
		return action("save", {
			saveAs,
			name: controls.name.value,
			fileName: controls.fileName.value,
		}, saveAs ? "Saving a new route…" : "Saving route…");
	}

	async function deleteSignalKResource() {
		const id = controls.resource.value;
		const selected = controls.resource.selectedOptions?.[0];
		if (!id) return;
		const label = selected?.dataset?.routeName || selected?.textContent || "this route";
		if (!confirmFn?.(`Delete the Signal K route “${label}”?\n\nThis cannot be undone.`)) return;
		setBusy(true, `Deleting ${label}…`);
		try {
			const response = await request("/delete-resource", {
				method: "POST",
				body: JSON.stringify({ id }),
			});
			applyActive(response.active, { fit: false });
			setBusy(false);
			await refresh({ fit: false });
			setStatus(`${response.deleted?.name || label} deleted.`);
		} catch (error) {
			setStatus(error.message, true);
		} finally {
			setBusy(false);
		}
	}

	function applyActive(value, { fit = false } = {}) {
		active = value || null;
		const nextFingerprint = activeRouteFingerprint(active);
		const changed = nextFingerprint !== fingerprint;
		fingerprint = nextFingerprint;
		if (changed) drawRoute({ fit });
		const summary = routeSummary(active);
		controls.title.textContent = summary.title;
		controls.details.textContent = summary.details;
		controls.reverse.disabled = !active;
		controls.reverse.checked = active?.reversed === true;
		controls.name.disabled = !active;
		controls.fileName.disabled = !active;
		controls.save.disabled = !active;
		controls.saveAs.disabled = !active;
		controls.close.disabled = !active;
		controls.download.classList.toggle("disabled", !active);
		controls.download.setAttribute("aria-disabled", active ? "false" : "true");
		controls.download.href = active ? `${API_BASE}/export` : "#";
		if (active && changed) {
			controls.name.value = active.resource?.name || "";
			controls.fileName.value = active.fileName || `${active.resource?.name || "route"}.gpx`;
		}
	}

	function drawRoute({ fit = false } = {}) {
		layer.clearLayers();
		const latLngs = routeLatLngs(active);
		if (latLngs.length < 2) return;
		const style = currentStyle();
		L.polyline(latLngs, {
			color: style.color,
			weight: style.weight,
			opacity: 0.9,
			interactive: false,
		}).addTo(layer);
		for (const arrow of routeArrowSegments(latLngs)) {
			const icon = L.divIcon({
				className: "ajrm-route-arrow-marker",
				html: `<span style="color:${style.color};transform:rotate(${arrow.rotation}deg)">➤</span>`,
				iconSize: [22, 22],
				iconAnchor: [11, 11],
			});
			L.marker(arrow.position, { icon, interactive: false }).addTo(layer);
		}
		layer.bringToFront?.();
		if (fit) map.fitBounds(latLngs, { padding: [30, 30], maxZoom: 15 });
	}

	function populateLists(response) {
		populateSelect(
			controls.piFile,
			response.piFiles || [],
			(file) => file.fileName,
			(file) => file.fileName,
			"No GPX files on the Pi",
		);
		populateSelect(
			controls.resource,
			response.resources || [],
			(route) => route.id,
			(route) => `${route.name} (${route.points} points · ${route.id.slice(0, 8)})`,
			"No Signal K route resources",
		);
		for (const option of controls.resource.options) {
			const route = (response.resources || []).find((entry) => entry.id === option.value);
			if (route) option.dataset.routeName = route.name;
		}
		controls.openPi.disabled = !controls.piFile.value;
		controls.openResource.disabled = !controls.resource.value;
		controls.deleteResource.disabled = !controls.resource.value;
	}

	function populateSelect(select, entries, value, label, emptyLabel) {
		const selected = select.value;
		select.replaceChildren();
		if (!entries.length) {
			select.add(new Option(emptyLabel, ""));
			return;
		}
		for (const entry of entries) select.add(new Option(label(entry), value(entry)));
		if (entries.some((entry) => value(entry) === selected)) select.value = selected;
	}

	function rememberBrowserFile() {
		const file = controls.browserFile.files?.[0];
		if (file) storage?.setItem?.(LAST_BROWSER_FILE_KEY, file.name);
		const previous = storage?.getItem?.(LAST_BROWSER_FILE_KEY);
		controls.browserFileHelp.textContent = previous
			? `Last selected on this device: ${previous}. Your browser controls which local folder opens next.`
			: "Supports OpenCPN, Savvy Navvy and standard GPX 1.1 route files.";
	}

	function applyStoredStyle() {
		const style = normalizeRouteStyle({
			color: storage?.getItem?.(ROUTE_COLOR_KEY),
			weight: storage?.getItem?.(ROUTE_WIDTH_KEY),
		});
		styleControls.color.value = style.color;
		styleControls.width.value = String(style.weight);
		styleControls.widthValue.textContent = `${style.weight} px`;
		rememberBrowserFile();
	}

	function updateStyle() {
		const style = currentStyle();
		storage?.setItem?.(ROUTE_COLOR_KEY, style.color);
		storage?.setItem?.(ROUTE_WIDTH_KEY, String(style.weight));
		styleControls.widthValue.textContent = `${style.weight} px`;
		drawRoute({ fit: false });
	}

	function currentStyle() {
		return normalizeRouteStyle({
			color: styleControls.color.value,
			weight: styleControls.width.value,
		});
	}

	async function request(path, options) {
		const response = await fetchFn(`${API_BASE}${path}`, {
			credentials: "include",
			cache: "no-store",
			headers: options.method === "POST" ? { "Content-Type": "application/json" } : undefined,
			...options,
		});
		const body = await response.json().catch(() => ({}));
		if (!response.ok || body.ok === false) throw new Error(body.error || `Route request failed (${response.status})`);
		return body;
	}

	function setBusy(value, message = "") {
		busy = value;
		if (message) setStatus(message);
		for (const control of [controls.openPi, controls.openResource, controls.deleteResource, controls.openBrowser, controls.save, controls.saveAs, controls.close]) {
			control.disabled = value || (!active && [controls.save, controls.saveAs, controls.close].includes(control));
		}
	}

	function setStatus(message, error = false) {
		controls.status.textContent = message || "";
		controls.status.classList.toggle("text-danger", error);
		controls.status.classList.toggle("text-success", !error && Boolean(message));
	}

	return { applyActive, drawRoute, init, refresh };
}
