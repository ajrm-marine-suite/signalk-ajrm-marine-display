import assert from "node:assert/strict";
import test from "node:test";

import {
	CHART_FOLDER_API_BASE,
	createChartFolderGroupsController,
	normaliseChartFolderResponse,
	renderChartFolderRows,
} from "../src/web/assets/scripts/chart-folder-groups.mjs";

const escapeHtml = (value) =>
	String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");

function panelParts() {
	const details = { hidden: true };
	const body = {
		innerHTML: "",
		querySelectorAll: () => [],
	};
	return {
		details,
		body,
		panel: {
			querySelector(selector) {
				return selector === "[data-chart-folder-groups]" ? details : body;
			},
		},
	};
}

test("normaliseChartFolderResponse preserves nested folder hierarchy and inherited state", () => {
	assert.deepEqual(
		normaliseChartFolderResponse({
			folders: ["/", "Antares/Selectors", "Antares", "Admiralty Charts"],
			folderStates: {
				Antares: { enabled: false, effectiveEnabled: false },
				"Antares/Selectors": { enabled: true, effectiveEnabled: false },
			},
		}),
		[
			{
				folderPath: "Admiralty Charts",
				name: "Admiralty Charts",
				depth: 0,
				enabled: true,
				effectiveEnabled: true,
			},
			{
				folderPath: "Antares",
				name: "Antares",
				depth: 0,
				enabled: false,
				effectiveEnabled: false,
			},
			{
				folderPath: "Antares/Selectors",
				name: "Selectors",
				depth: 1,
				enabled: true,
				effectiveEnabled: false,
			},
		],
	);
});

test("renderChartFolderRows indents children and marks inherited disabling", () => {
	const html = renderChartFolderRows({
		folders: normaliseChartFolderResponse({
			folders: ["Antares", "Antares/Selectors"],
			folderStates: {
				Antares: { enabled: false, effectiveEnabled: false },
				"Antares/Selectors": { enabled: true, effectiveEnabled: false },
			},
		}),
		escapeHtml,
	});
	assert.match(html, /value="Antares"/);
	assert.match(html, /--chart-folder-depth: 1/);
	assert.match(html, /is-inherited-disabled/);
	assert.match(html, /disabled by a parent folder/);
});

test("folder controller loads supported provider folders", async () => {
	const { body, details, panel } = panelParts();
	const calls = [];
	const controller = createChartFolderGroupsController({
		autoCharts: {},
		escapeHtml,
		fetchFn: async (...args) => {
			calls.push(args);
			return {
				ok: true,
				status: 200,
				json: async () => ({ folders: ["/", "Antares"], folderStates: {} }),
			};
		},
	});
	assert.equal(await controller.refresh(panel), true);
	assert.equal(details.hidden, false);
	assert.match(body.innerHTML, /Antares/);
	assert.equal(calls[0][0], `${CHART_FOLDER_API_BASE}/local-charts`);
	assert.equal(calls[0][1].credentials, "same-origin");
});

test("folder controller hides controls for an older provider without the API", async () => {
	const { details, panel } = panelParts();
	const controller = createChartFolderGroupsController({
		autoCharts: {},
		escapeHtml,
		fetchFn: async () => ({ ok: false, status: 404 }),
	});
	assert.equal(await controller.refresh(panel), false);
	assert.equal(details.hidden, true);
});

test("folder toggle refreshes and redraws Auto Charts", async () => {
	const { panel } = panelParts();
	const calls = [];
	const autoCalls = [];
	const controller = createChartFolderGroupsController({
		autoCharts: {
			refreshCharts: async () => autoCalls.push("refresh"),
			update: () => autoCalls.push("update"),
		},
		escapeHtml,
		fetchFn: async (url, options) => {
			calls.push([url, options]);
			return url.endsWith("/folders/toggle")
				? { ok: true, status: 200 }
				: {
						ok: true,
						status: 200,
						json: async () => ({ folders: ["Antares"], folderStates: {} }),
					};
		},
	});
	assert.equal(
		await controller.setEnabled({
			panel,
			folderPath: "Antares",
			enabled: false,
		}),
		true,
	);
	assert.deepEqual(autoCalls, ["refresh", "update"]);
	assert.deepEqual(JSON.parse(calls[0][1].body), {
		folderPath: "Antares",
		enabled: false,
	});
	assert.equal(calls[0][1].method, "POST");
});
