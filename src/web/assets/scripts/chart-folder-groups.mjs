/**
 * Implements the chart folder groups responsibilities of the AJRM Marine Display browser application.
 */

export const CHART_FOLDER_INPUT_NAME = "ajrm-marine-chart-folder";
export const CHART_FOLDER_API_BASE = "/plugins/signalk-charts-provider-simple";

function folderDepth(folderPath) {
	return Math.max(0, folderPath.split("/").filter(Boolean).length - 1);
}

function folderName(folderPath) {
	return folderPath.split("/").filter(Boolean).at(-1) || folderPath;
}

export function normaliseChartFolderResponse(payload) {
	const states = payload?.folderStates ?? {};
	return (Array.isArray(payload?.folders) ? payload.folders : [])
		.filter((folderPath) => folderPath && folderPath !== "/")
		.map((folderPath) => ({
			folderPath,
			name: folderName(folderPath),
			depth: folderDepth(folderPath),
			enabled: states[folderPath]?.enabled !== false,
			effectiveEnabled: states[folderPath]?.effectiveEnabled !== false,
		}))
		.sort((left, right) =>
			left.folderPath.localeCompare(right.folderPath, undefined, {
				numeric: true,
				sensitivity: "base",
			}),
		);
}

export function renderChartFolderRows({ folders, escapeHtml }) {
	if (folders.length === 0) {
		return '<div class="ajrm-marine-chart-folders-message">No chart folders found</div>';
	}
	return folders
		.map((folder) => {
			const inheritedDisabled = folder.enabled && !folder.effectiveEnabled;
			return `
				<label class="ajrm-marine-chart-folder-option${inheritedDisabled ? " is-inherited-disabled" : ""}" style="--chart-folder-depth: ${folder.depth}" title="${escapeHtml(folder.folderPath)}${inheritedDisabled ? " (disabled by a parent folder)" : ""}">
					<input type="checkbox" name="${CHART_FOLDER_INPUT_NAME}" value="${escapeHtml(folder.folderPath)}"${folder.enabled ? " checked" : ""} />
					<span>${escapeHtml(folder.name)}</span>
				</label>
			`;
		})
		.join("");
}

function chartFolderElements(panel) {
	return {
		details: panel?.querySelector?.("[data-chart-folder-groups]") ?? null,
		body: panel?.querySelector?.("[data-chart-folder-body]") ?? null,
	};
}

function responseError(response, fallback) {
	if (response.status === 401 || response.status === 403) {
		return new Error(
			"Sign in as a Signal K administrator to change chart folders.",
		);
	}
	return new Error(`${fallback} (HTTP ${response.status})`);
}

function folderInput(body, folderPath) {
	return [...(body?.querySelectorAll?.(`input[name="${CHART_FOLDER_INPUT_NAME}"]`) ?? [])]
		.find((input) => input.value === folderPath);
}

export function createChartFolderGroupsController({
	autoCharts,
	escapeHtml,
	fetchFn = (...args) => globalThis.fetch(...args),
}) {
	async function refresh(panel) {
		const { details, body } = chartFolderElements(panel);
		if (!details || !body) return false;
		body.innerHTML =
			'<div class="ajrm-marine-chart-folders-message">Loading chart folders…</div>';
		try {
			const response = await fetchFn(`${CHART_FOLDER_API_BASE}/local-charts`, {
				credentials: "same-origin",
			});
			if (response.status === 404) {
				details.hidden = true;
				return false;
			}
			if (!response.ok) throw responseError(response, "Could not load chart folders");
			const folders = normaliseChartFolderResponse(await response.json());
			details.hidden = folders.length === 0;
			body.innerHTML = renderChartFolderRows({ folders, escapeHtml });
			return true;
		} catch (error) {
			details.hidden = false;
			body.innerHTML = `<div class="ajrm-marine-chart-folders-message is-error">${escapeHtml(error?.message || "Could not load chart folders")}</div>`;
			return false;
		}
	}

	async function setEnabled({ panel, folderPath, enabled }) {
		const { body } = chartFolderElements(panel);
		const input = folderInput(body, folderPath);
		if (input) input.disabled = true;
		try {
			const response = await fetchFn(`${CHART_FOLDER_API_BASE}/folders/toggle`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "same-origin",
				body: JSON.stringify({ folderPath, enabled }),
			});
			if (!response.ok) throw responseError(response, "Could not change chart folder");
			await autoCharts?.refreshCharts?.();
			autoCharts?.update?.();
			await refresh(panel);
			return true;
		} catch (error) {
			if (input) {
				input.checked = !enabled;
				input.disabled = false;
			}
			if (body) {
				const message = globalThis.document?.createElement?.("div");
				if (message) {
					message.className = "ajrm-marine-chart-folders-message is-error";
					message.textContent = error?.message || "Could not change chart folder";
					body.prepend(message);
				}
			}
			return false;
		}
	}

	return { refresh, setEnabled };
}
