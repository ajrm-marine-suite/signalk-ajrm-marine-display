import {
	classARowsHidden,
	selectedVesselAlertState,
} from "./selected-vessel-state.mjs";

let lastSelectedVesselDetailsSignature = null;

export function renderSelectedVesselDetails({
	target,
	targetSilence,
	activateToolTips,
}) {
	const signature = selectedVesselDetailsSignature(target);
	if (signature === lastSelectedVesselDetailsSignature) return false;
	targetSilence.updateButtonMuteToggleIcon(target);
	setText("target.name", target.name);
	setText("target.spokenSummary", target.spokenSummary || "---");
	setText("target.lastSeen", target.lastSeen);
	setText("target.cpaFormatted", target.cpaFormatted);
	setText("target.tcpaFormatted", target.tcpaFormatted);
	setText("target.rangeFormatted", target.rangeFormatted);
	setText("target.bearingFormatted", target.bearingFormatted);
	setText("target.sogFormatted", target.sogFormatted);
	setText("target.cogFormatted", target.cogFormatted);
	setText("target.hdgFormatted", target.hdgFormatted);
	setText("target.rotFormatted", target.rotFormatted);
	setText("target.callsign", target.callsign);
	setText("target.mmsi", target.mmsi);
	setText("target.mmsiCountryCode", target.mmsiCountryCode);
	setElementAttributeIfChanged(
		document.getElementById("target.mmsiCountryCode"),
		"data-bs-title",
		target.mmsiCountryName,
	);
	setText("target.type", target.type);
	setText("target.aisClassFormatted", target.aisClassFormatted);
	setText("target.status", target.status);
	setText("target.sizeFormatted", target.sizeFormatted);
	setText(
		"target.vesselFootprintSourceFormatted",
		target.vesselFootprintSourceFormatted,
	);
	setText("target.draft", target.draft);
	setText("target.destination", target.destination);
	setText("target.eta", target.eta);
	setText("target.imoFormatted", target.imoFormatted);
	setText("target.latitudeFormatted", target.latitudeFormatted);
	setText("target.longitudeFormatted", target.longitudeFormatted);

	activateToolTips();
	updateClassAFields(target);
	updateSelectedVesselAlert(target);
	lastSelectedVesselDetailsSignature = signature;
	return true;
}

export function resetSelectedVesselDetailsCache() {
	lastSelectedVesselDetailsSignature = null;
}

export function selectedVesselDetailsSignature(target) {
	return [
		target.mmsi,
		target.name,
		target.spokenSummary,
		target.lastSeen,
		target.cpaFormatted,
		target.tcpaFormatted,
		target.rangeFormatted,
		target.bearingFormatted,
		target.sogFormatted,
		target.cogFormatted,
		target.hdgFormatted,
		target.rotFormatted,
		target.callsign,
		target.mmsiCountryCode,
		target.mmsiCountryName,
		target.type,
		target.aisClass,
		target.aisClassFormatted,
		target.status,
		target.sizeFormatted,
		target.vesselFootprintSourceFormatted,
		target.draft,
		target.destination,
		target.eta,
		target.imoFormatted,
		target.latitudeFormatted,
		target.longitudeFormatted,
		target.alarmIsMuted,
		target.alarmState,
		target.alertLabel,
	].map((value) => String(value ?? "")).join("\u001f");
}

function setText(id, value) {
	setElementTextIfChanged(document.getElementById(id), value ?? "---");
}

export function setElementTextIfChanged(element, value) {
	const text = String(value);
	if (element.textContent === text) return false;
	element.textContent = text;
	return true;
}

export function setElementAttributeIfChanged(element, name, value) {
	const text = String(value);
	if (element.getAttribute?.(name) === text) return false;
	element.setAttribute(name, value);
	return true;
}

export function setElementClassPresenceIfChanged(element, className, present) {
	const current = element.classList?.contains?.(className);
	if (current === present) return false;
	const method = present ? "add" : "remove";
	element.classList[method](className);
	return true;
}

function updateClassAFields(target) {
	const classARows = document.querySelectorAll(".ais-class-a");
	const hidden = classARowsHidden(target);
	classARows.forEach((row) => {
		setElementClassPresenceIfChanged(row, "d-none", hidden);
	});
}

function updateSelectedVesselAlert(target) {
	const selectedVesselAlert = document.getElementById("selectedVesselAlert");
	const state = selectedVesselAlertState(target);

	if (state.hidden) {
		setElementClassPresenceIfChanged(selectedVesselAlert, "d-none", true);
		return;
	}
	setElementClassPresenceIfChanged(selectedVesselAlert, state.removeClass, false);
	setElementClassPresenceIfChanged(selectedVesselAlert, state.addClass, true);
	setElementTextIfChanged(selectedVesselAlert, state.text);
	setElementClassPresenceIfChanged(selectedVesselAlert, "d-none", false);
}
