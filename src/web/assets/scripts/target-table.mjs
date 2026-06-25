import { escapeHtml } from "./alert-events.mjs";
import { compareTargetRows, targetTableRowClass } from "./target-table-state.mjs";

function targetDisplayText(value, placeholder = "---") {
	if (value === undefined || value === null || value === "") {
		return placeholder;
	}
	return escapeHtml(String(value));
}

function hasFiniteNumber(value) {
	return typeof value === "number" && Number.isFinite(value);
}

export function renderTargetTable({ targets, selfMmsi, sortBy, getTargetSvg }) {
	const targetsArray = sortedTargetRows({ targets, sortBy });

	let html = "";
	let rowCount = 0;

	for (const target of targetsArray) {
		if (target.mmsi === selfMmsi || !target.isValid) continue;
		const className = targetTableRowClass(target);
		const targetName = targetDisplayText(target.name || `<${target.mmsi}>`);
		const silenceLabel = target.alarmIsMuted ? "Unsilence" : "Silence";
		const hasCpa = hasFiniteNumber(target.cpa);
		const hasTcpa = hasFiniteNumber(target.tcpa);
		html += `
                <tr class="${className}" data-mmsi="${target.mmsi}">
					<td scope="row">
						${getTargetSvg(target)}
					</td>
					<th>
						${targetName} ${target.alarmIsMuted ? '<span class="badge text-bg-secondary ms-1">Silenced</span>' : ""}
					</th>
					<td class="text-end">${targetDisplayText(target.bearingFormatted)}</td>
					<td class="text-end">${targetDisplayText(target.rangeFormatted)}</td>
					<td class="text-end">${targetDisplayText(target.sogFormatted)}</td>
					<td class="text-end">${hasCpa ? targetDisplayText(target.cpaFormatted) : ""}</td>
					<td class="text-end">${hasTcpa ? targetDisplayText(target.tcpaFormatted) : ""}</td>
					<td class="text-end"><button type="button" class="btn btn-sm ${target.alarmIsMuted ? "btn-secondary" : "btn-outline-secondary"}" data-target-mute-button data-mmsi="${target.mmsi}" title="${silenceLabel} target" aria-label="${silenceLabel} ${targetName}"><i class="bi ${target.alarmIsMuted ? "bi-volume-mute-fill" : "bi-volume-up-fill"}"></i></button></td>
                </tr>`;
		html += `
                <tr class="${className} ais-target-spoken" data-mmsi="${target.mmsi}">
					<td colspan="8" class="text-body-secondary small">${target.spokenSummary ? escapeHtml(target.spokenSummary) : "&nbsp;"}</td>
                </tr>`;
		rowCount++;
	}

	return { html, rowCount };
}

export function targetTableRenderKey({ targets, selfMmsi, sortBy }) {
	const rows = sortedTargetRows({ targets, sortBy })
		.filter((target) => target.mmsi !== selfMmsi && target.isValid)
		.map((target) => [
			target.mmsi,
			target.name,
			target.alarmState,
			target.alarmIsMuted === true,
			target.bearingFormatted,
			target.rangeFormatted,
			target.sogFormatted,
			target.cpa,
			target.cpaFormatted,
			target.tcpa,
			target.tcpaFormatted,
			target.spokenSummary,
			target.typeId,
			target.aisClass,
			target.isAton === true,
			target.order,
			target.range,
		]);
	return JSON.stringify({ sortBy, rows });
}

function sortedTargetRows({ targets, sortBy }) {
	return Array.from(targets.values()).sort((a, b) => {
		try {
			return compareTargetRows(a, b, sortBy);
		} catch (error) {
			console.error(error);
			return 0;
		}
	});
}
