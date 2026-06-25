import {
	distanceToTick,
	speedToTick,
	timeToTick,
} from "./range-control-scales.mjs";
import {
	distanceDisplayState,
	speedDisplayText,
	timeDisplayText,
} from "./profile-edit-display-state.mjs";
import { selectedProfileCriteria } from "./profile-edit-state.mjs";

export function profileEditRangeTicks({ profiles, profileName, size }) {
	const warningCriteria = selectedProfileCriteria({
		profiles,
		profileName,
		alarmType: "warning",
		size,
	});
	const dangerCriteria = selectedProfileCriteria({
		profiles,
		profileName,
		alarmType: "danger",
		size,
	});
	const guardCriteria = profiles[profileName].guard;

	return {
		warningCpa: distanceToTick(warningCriteria.cpa),
		warningTcpa: timeToTick(warningCriteria.tcpa / 60),
		warningSog: speedToTick(warningCriteria.speed),
		alarmCpa: distanceToTick(dangerCriteria.cpa),
		alarmTcpa: timeToTick(dangerCriteria.tcpa / 60),
		alarmSog: speedToTick(dangerCriteria.speed),
		guardRange: distanceToTick(guardCriteria.range),
		guardSog: speedToTick(guardCriteria.speed),
	};
}

export function applyProfileEditRangeTicks(controls, ticks) {
	controls.warningCpaRange.value = ticks.warningCpa;
	controls.warningTcpaRange.value = ticks.warningTcpa;
	controls.warningSogRange.value = ticks.warningSog;
	controls.alarmCpaRange.value = ticks.alarmCpa;
	controls.alarmTcpaRange.value = ticks.alarmTcpa;
	controls.alarmSogRange.value = ticks.alarmSog;
	controls.guardRangeRange.value = ticks.guardRange;
	controls.guardSogRange.value = ticks.guardSog;
}

export function dispatchProfileEditInputEvents(controls, EventClass = Event) {
	const inputEvent = new EventClass("input");
	controls.warningCpaRange.dispatchEvent(inputEvent);
	controls.warningTcpaRange.dispatchEvent(inputEvent);
	controls.warningSogRange.dispatchEvent(inputEvent);
	controls.alarmCpaRange.dispatchEvent(inputEvent);
	controls.alarmTcpaRange.dispatchEvent(inputEvent);
	controls.alarmSogRange.dispatchEvent(inputEvent);
	controls.guardRangeRange.dispatchEvent(inputEvent);
	controls.guardSogRange.dispatchEvent(inputEvent);
}

function displayStateForControl(control, state) {
	const target = control?.dataset?.target;
	if (!target) return null;
	return {
		target,
		...(state.unitsHidden !== undefined
			? { unitsTarget: `${target}Units` }
			: {}),
		...state,
	};
}

export function profileEditRangeDisplayStates({
	controls,
	profiles,
	profileName,
	size,
}) {
	const warningCriteria = selectedProfileCriteria({
		profiles,
		profileName,
		alarmType: "warning",
		size,
	});
	const dangerCriteria = selectedProfileCriteria({
		profiles,
		profileName,
		alarmType: "danger",
		size,
	});
	const guardCriteria = profiles[profileName].guard;

	return [
		displayStateForControl(
			controls.warningCpaRange,
			distanceDisplayState(warningCriteria.cpa),
		),
		displayStateForControl(controls.warningTcpaRange, {
			text: timeDisplayText(warningCriteria.tcpa / 60),
		}),
		displayStateForControl(controls.warningSogRange, {
			text: speedDisplayText(warningCriteria.speed),
		}),
		displayStateForControl(
			controls.alarmCpaRange,
			distanceDisplayState(dangerCriteria.cpa),
		),
		displayStateForControl(controls.alarmTcpaRange, {
			text: timeDisplayText(dangerCriteria.tcpa / 60),
		}),
		displayStateForControl(controls.alarmSogRange, {
			text: speedDisplayText(dangerCriteria.speed),
		}),
		displayStateForControl(
			controls.guardRangeRange,
			distanceDisplayState(guardCriteria.range),
		),
		displayStateForControl(controls.guardSogRange, {
			text: speedDisplayText(guardCriteria.speed),
		}),
	].filter(Boolean);
}

export function applyProfileEditRangeDisplays({
	controls,
	profiles,
	profileName,
	size,
	documentRef = globalThis.document,
}) {
	if (!documentRef) return [];
	const states = profileEditRangeDisplayStates({
		controls,
		profiles,
		profileName,
		size,
	});
	for (const state of states) {
		applyRangeControlDisplay(documentRef, state);
	}
	return states;
}

export function applySensitivityControlValues(sensitivityControls, values) {
	sensitivityControls.cpaRange.value = values.cpa;
	sensitivityControls.tcpaRange.value = values.tcpa;
	sensitivityControls.repeatRange.value = values.repeat;
	sensitivityControls.cpaValue.textContent = sensitivityControls.cpaRange.value;
	sensitivityControls.tcpaValue.textContent =
		sensitivityControls.tcpaRange.value;
	sensitivityControls.repeatValue.textContent =
		sensitivityControls.repeatRange.value;
}

export function applyRangeControlDisplay(documentRef, state) {
	if (state.unitsTarget) {
		const units = documentRef.getElementById(state.unitsTarget);
		units.hidden = state.unitsHidden;
		if (state.unitsText !== undefined) units.textContent = state.unitsText;
	}
	documentRef.getElementById(state.target).textContent = state.text;
}

export function applyProfileResetSelection(controls, currentProfile) {
	controls.selectActiveProfile.value = currentProfile;
	controls.selectProfileToEdit.value = currentProfile;
}
