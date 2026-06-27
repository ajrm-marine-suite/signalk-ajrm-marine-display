import { toDegrees } from "../../../shared/ais-utils.mjs";
import { createAisDivIcon } from "./ais-icon-utils.mjs";

function getVesselIconSize(isLarge) {
	return {
		boxSize: isLarge ? 70 : 50,
		strokeWidth: isLarge ? 4 : 2,
	};
}

function getLostTargetCross(boxSize) {
	const crosshairLength = boxSize * 0.8;
	return `
        <path d="M${boxSize * 0.5},${boxSize * 0.5 - crosshairLength / 2} v${crosshairLength} M${boxSize * 0.5 - crosshairLength / 2},${boxSize * 0.5} h${crosshairLength}"
            stroke="red"
            stroke-width=2
            stroke-opacity=1
            transform="rotate(45 ${boxSize / 2} ${boxSize / 2})"
        />`;
}

function getRotationArrow(target, boxSize, strokeWidth) {
	const rotDegrees = toDegrees(target.rot);
	if (!Number.isFinite(rotDegrees) || Math.abs(rotDegrees) < 0.1) return "";
	const direction = rotDegrees > 0 ? 1 : -1;
	const center = boxSize / 2;
	const startX = center - direction * boxSize * 0.08;
	const startY = boxSize * 0.28;
	const endX = center + direction * boxSize * 0.34;
	const endY = boxSize * 0.2;
	const controlX1 = center + direction * boxSize * 0.02;
	const controlY1 = boxSize * 0.02;
	const controlX2 = center + direction * boxSize * 0.38;
	const controlY2 = boxSize * 0.02;
	const path = `M${startX},${startY} C${controlX1},${controlY1} ${controlX2},${controlY2} ${endX},${endY}`;
	const headBackX1 = endX - direction * boxSize * 0.2;
	const headBackY1 = endY - boxSize * 0.03;
	const headBackX2 = endX - direction * boxSize * 0.04;
	const headBackY2 = endY - boxSize * 0.2;
	const head = `${endX},${endY} ${headBackX1},${headBackY1} ${headBackX2},${headBackY2}`;
	const haloWidth = Math.max(strokeWidth + 5, 7);
	const arrowWidth = Math.max(strokeWidth + 2, 4);
	return `
        <g class="ajrm-marine-rotation-arrow" fill="none" stroke-linecap="round" stroke-linejoin="round" pointer-events="none">
            <path d="${path}" stroke="#ffffff" stroke-width="${haloWidth}" stroke-opacity="0.95" />
            <polygon points="${head}" fill="#ffffff" stroke="#ffffff" stroke-width="${haloWidth * 0.45}" stroke-opacity="0.95" />
            <path d="${path}" stroke="#111111" stroke-width="${arrowWidth}" />
            <polygon points="${head}" fill="#111111" stroke="#111111" stroke-width="1" />
        </g>`;
}

export function getClassBIcon(target, isLarge, color) {
	const { boxSize, strokeWidth } = getVesselIconSize(isLarge);
	var boatLengthToBeam = 1.8;
	var margin = 10;
	var boatLength = boxSize - 2 * margin;
	var boatCenterOffset = margin / 2;
	var boatBeam = boatLength / boatLengthToBeam;
	const SVGIcon = `
    <svg width="${boxSize}px" height="${boxSize}px" pointerEvents="none">
        <g transform="rotate(${toDegrees(target.hdg || target.cog) || 0} ${boxSize / 2} ${boxSize / 2})">
            <polygon
                points="${boxSize / 2 - boatBeam / 2},  ${boxSize / 2 + boatLength / 2 - boatCenterOffset}
                        ${boxSize / 2},                 ${boxSize / 2 - boatLength / 2 - boatCenterOffset}
                        ${boxSize / 2 + boatBeam / 2},  ${boxSize / 2 + boatLength / 2 - boatCenterOffset}"
				fill="${color}"
				fill-opacity=1
				stroke-width=${strokeWidth}
				stroke="${color}"
                stroke-opacity=1
                pointer-events="all"
            />
            ${getRotationArrow(target, boxSize, strokeWidth)}
        </g>
        ${target.isLost ? getLostTargetCross(boxSize) : ""}
    </svg>`;

	return createAisDivIcon({ html: SVGIcon, boxSize });
}

export function getClassAIcon(target, isLarge, color) {
	const { boxSize, strokeWidth } = getVesselIconSize(isLarge);
	var boatLengthToBeam = 2.2;
	var bowLengthToBoatLength = 0.4;
	var margin = 10;
	var boatLength = boxSize - 2 * margin;
	var boatBeam = boatLength / boatLengthToBeam;
	const SVGIcon = `
    <svg width="${boxSize}px" height="${boxSize}px" pointerEvents="none">
        <g transform="rotate(${toDegrees(target.hdg || target.cog) || 0} ${boxSize / 2} ${boxSize / 2})">
            <polygon
                points="
                    ${boxSize / 2 - boatBeam / 2},   ${boxSize / 2 + boatLength / 2}
                    ${boxSize / 2 - boatBeam / 2},   ${boxSize / 2 - boatLength / 2 + boatLength * bowLengthToBoatLength}
                    ${boxSize / 2},                  ${boxSize / 2 - boatLength / 2}
                    ${boxSize / 2 + boatBeam / 2},   ${boxSize / 2 - boatLength / 2 + boatLength * bowLengthToBoatLength}
                    ${boxSize / 2 + boatBeam / 2},   ${boxSize / 2 + boatLength / 2}"
				fill="${color}"
				fill-opacity=1
				stroke-width=${strokeWidth}
				stroke="${color}"
                stroke-opacity=1
                pointer-events="all"
            />
            ${getRotationArrow(target, boxSize, strokeWidth)}
        </g>
        ${target.isLost ? getLostTargetCross(boxSize) : ""}
    </svg>`;

	return createAisDivIcon({ html: SVGIcon, boxSize });
}
