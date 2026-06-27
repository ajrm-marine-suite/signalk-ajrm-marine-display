import {
	targetCountContribution,
	targetTooltipHtml,
	targetTooltipSignature,
} from "./target-presentation.mjs";

export function applyNonSelfTargetMarkerPresentation({
	target,
	selfMmsi,
	boatMarker,
	labelCollision,
	deferLabelCollision = false,
	tooltipHtmlForTarget = targetTooltipHtml,
	tooltipSignatureForTarget = targetTooltipSignature,
}) {
	if (target.mmsi === selfMmsi) {
		return { valid: 0, filtered: 0, alarm: 0 };
	}

	const counts = targetCountContribution(target, selfMmsi);
	const tooltipSignature = tooltipSignatureForTarget(target);
	if (boatMarker._ajrmMarineTooltipSignature !== tooltipSignature) {
		const tooltipHtml = tooltipHtmlForTarget(target);
		boatMarker.setTooltipContent(tooltipHtml);
		boatMarker._ajrmMarineTooltipHtml = tooltipHtml;
		boatMarker._ajrmMarineTooltipSignature = tooltipSignature;
	}
	if (!deferLabelCollision) {
		labelCollision.add(boatMarker, target.mmsi, target.order);
	}
	return counts;
}
