export function selectedVesselAlertState(target) {
	if (target.alarmState === "danger") {
		return {
			hidden: false,
			addClass: "alert-danger",
			removeClass: "alert-warning",
			text: target.alertLabel || "Collision alarm",
		};
	}
	if (target.alarmState === "warning") {
		return {
			hidden: false,
			addClass: "alert-warning",
			removeClass: "alert-danger",
			text: target.alertLabel || "Traffic advisory",
		};
	}
	return { hidden: true };
}

export function classARowsHidden(target) {
	return target.aisClass !== "A";
}
