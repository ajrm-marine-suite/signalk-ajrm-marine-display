import { createAisDivIcon } from "./ais-icon-utils.mjs";

function getStationIconSize(isLarge) {
	return {
		boxSize: isLarge ? 50 : 40,
		strokeWidth: isLarge ? 4 : 2,
	};
}

function getLostTargetCross(boxSize) {
	const isLostCrosshairLength = boxSize * 0.8;
	return `
        <path d="M${boxSize * 0.5},${boxSize * 0.5 - isLostCrosshairLength / 2} v${isLostCrosshairLength} M${boxSize * 0.5 - isLostCrosshairLength / 2},${boxSize * 0.5} h${isLostCrosshairLength}"
            stroke="red"
            stroke-width=2
            stroke-opacity=1
            transform="rotate(45 ${boxSize / 2} ${boxSize / 2})"
        />`;
}

export function getAtonIcon(target, isLarge, color) {
	const { boxSize, strokeWidth } = getStationIconSize(isLarge);
	var margin = 12;
	var atonSize = boxSize - 2 * margin;
	var crosshairLength = atonSize * 0.6;

	const SVGIcon = `
    <svg width="${boxSize}px" height="${boxSize}px" pointerEvents="none">
        <rect x="${margin}" y="${margin}" width="${atonSize}" height="${atonSize}"
            transform="rotate(45 ${boxSize / 2} ${boxSize / 2})"
            fill="${color}"
            fill-opacity=0.3
            stroke-width=${strokeWidth}
            ${target.isVirtual ? 'stroke-dasharray="2 2"' : ""}
            stroke="${color}"
            stroke-opacity=1
        />
        <path d="M${boxSize * 0.5},${boxSize * 0.5 - crosshairLength / 2} v${crosshairLength} M${boxSize * 0.5 - crosshairLength / 2},${boxSize * 0.5} h${crosshairLength}"
            stroke="${color}"
            stroke-width=2
            stroke-opacity=1
        />
        ${target.isLost ? getLostTargetCross(boxSize) : ""}
    </svg>`;

	return createAisDivIcon({ html: SVGIcon, boxSize });
}

export function getBaseIcon(target, isLarge, color) {
	const { boxSize, strokeWidth } = getStationIconSize(isLarge);
	var margin = 12;
	var atonSize = boxSize - 2 * margin;
	var crosshairLength = atonSize * 0.6;

	const SVGIcon = `
    <svg width="${boxSize}px" height="${boxSize}px" pointerEvents="none">
        <rect x="${margin}" y="${margin}" width="${atonSize}" height="${atonSize}"
            fill="${color}"
            fill-opacity=0.3
            stroke-width=${strokeWidth}
            stroke="${color}"
            stroke-opacity=1
        />
        <path d="M${boxSize * 0.5},${boxSize * 0.5 - crosshairLength / 2} v${crosshairLength} M${boxSize * 0.5 - crosshairLength / 2},${boxSize * 0.5} h${crosshairLength}"
            stroke="${color}"
            stroke-width=2
            stroke-opacity=1
        />
        ${target.isLost ? getLostTargetCross(boxSize) : ""}
    </svg>`;

	return createAisDivIcon({ html: SVGIcon, boxSize });
}
