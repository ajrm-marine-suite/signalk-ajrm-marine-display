export function targetIconPresentation({ target, selectedVesselMmsi }) {
	if (target.mmsi === selectedVesselMmsi) {
		return { color: "blue", isLarge: true };
	}
	if (target.alarmState === "danger") {
		return { color: "red", isLarge: true };
	}
	if (target.alarmState === "warning") {
		return { color: "orange", isLarge: true };
	}
	return { color: "black", isLarge: false };
}

export function targetTooltipHtml(target) {
	let tooltipText = `${target.name}${target.alarmIsMuted ? ' <span class="badge text-bg-secondary">Silenced</span>' : ""}<br/>`;
	if (target.sog > 0.1) {
		tooltipText += `${target.sogFormatted} `;
	}
	if (target.cpa) {
		tooltipText += `${target.cpaFormatted} `;
	}
	if (target.tcpa > 0 && target.tcpa < 3600) {
		tooltipText += target.tcpaFormatted;
	}
	return `${tooltipText}&nbsp`;
}

export function targetTooltipSignature(target) {
	const showSog = target.sog > 0.1;
	const showCpa = Boolean(target.cpa);
	const showTcpa = target.tcpa > 0 && target.tcpa < 3600;
	return [
		target.name || "",
		target.alarmIsMuted ? "1" : "0",
		showSog ? target.sogFormatted || "" : "",
		showCpa ? target.cpaFormatted || "" : "",
		showTcpa ? target.tcpaFormatted || "" : "",
	].join("\u001f");
}

export function targetCountContribution(target, selfMmsi) {
	if (target.mmsi === selfMmsi) {
		return { valid: 0, filtered: 0, alarm: 0 };
	}
	return {
		valid: 1,
		filtered: target.alarmState ? 1 : 0,
		alarm: target.alarmState === "danger" ? 1 : 0,
	};
}
