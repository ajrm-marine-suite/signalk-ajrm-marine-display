import { serverEventToAlarmState } from "./alert-events.mjs";

export function resetTargetAlertDisplayState(target) {
	target.alarmState = null;
	target.alarmType = null;
	target.alertLabel = "";
	target.collisionAlarm = false;
	target.collisionWarning = false;
	target.sartAlarm = false;
	target.mobAlarm = false;
	target.epirbAlarm = false;
}

export function applyServerAlertEventToTarget(target, event) {
	const alarmState = serverEventToAlarmState(event);
	if (!alarmState) return false;

	target.alarmState = alarmState;
	target.alarmType = event.category || "cpa";
	target.alertLabel = event.uiLabel || target.alertLabel;
	target.spokenSummary = event.message || target.spokenSummary;
	target.vesselSizeCategory = event.sizeCategory || target.vesselSizeCategory;
	target.order = Number.isFinite(event.uiOrder) ? event.uiOrder : 0;
	return true;
}
