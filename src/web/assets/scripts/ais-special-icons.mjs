import { createAisDivIcon } from "./ais-icon-utils.mjs";
import { toDegrees } from "../../../shared/ais-utils.mjs";

const SELF_ICON_FILL_OPACITY = "0.6";
const SELF_ICON_DOT_FILL_OPACITY = "0.7";

export function getBlueBoxIcon() {
	var boxSize = 80;
	var margin = 10;
	var blueBoxSize = boxSize - 2 * margin;
	const SVGIcon = `
    <svg width="${boxSize}px" height="${boxSize}px" pointerEvents="none">
        <rect
            style="stroke:#3c48be;stroke-width:5;stroke-dasharray:${(blueBoxSize * 3) / 4} ${blueBoxSize / 4} ${(blueBoxSize * 3) / 4} ${blueBoxSize / 4};stroke-dashoffset:${(blueBoxSize * 3) / 8};stroke-opacity:1.0;fill-opacity:0"
            width="${blueBoxSize}"
            height="${blueBoxSize}"
            x="${margin}"
            y="${margin}" />
    </svg>`;

	return createAisDivIcon({ html: SVGIcon, boxSize });
}

export function getSartIcon() {
	var boxSize = 40;
	var strokeWidth = 2;
	var radius = 15;

	const SVGIcon = `
    <svg width="${boxSize}px" height="${boxSize}px" pointerEvents="none">
        <g
            fill-opacity=0
            stroke-width=${strokeWidth}
            stroke="red"
            stroke-opacity=1
        >
            <circle cx="${boxSize / 2}" cy="${boxSize / 2}" r="${radius}" />
            <path d="M${boxSize * 0.5},${boxSize * 0.5 - radius} v${radius * 2} M${boxSize * 0.5 - radius},${boxSize * 0.5} h${radius * 2}"
                transform="rotate(45 ${boxSize / 2} ${boxSize / 2})"
            />
        </g>
    </svg>`;

	return createAisDivIcon({ html: SVGIcon, boxSize });
}

export function getSelfIcon(
	target = {},
	variant = "rings",
	fillColor = "#ff00ff",
) {
	var boxSize = variant === "boat" ? 60 : 40;
	var strokeWidth = 2;
	const center = boxSize / 2;
	const heading = toDegrees(target.hdg || target.cog) || 0;
	const shape = getSelfIconShape({
		boxSize,
		center,
		fillColor,
		heading,
		strokeWidth,
		variant,
	});

	const SVGIcon = `
    <svg width="${boxSize}px" height="${boxSize}px" pointerEvents="none">
        <g
            fill-opacity=0
            stroke-width=${strokeWidth}
            stroke="gray"
            stroke-opacity=1
        >
            ${shape}
        </g>
    </svg>`;

	return createAisDivIcon({ html: SVGIcon, boxSize });
}

function getSelfIconShape({
	boxSize,
	center,
	fillColor,
	heading,
	strokeWidth,
	variant,
}) {
	if (variant === "crosshair") {
		return `
            <circle cx="${center}" cy="${center}" r="16" />
            <path d="M${center},${center - 17} v34 M${center - 17},${center} h34" />`;
	}
	if (variant === "triangle") {
		return `
            <polygon
                points="${center},5 ${boxSize - 9},${boxSize - 8} ${center},${boxSize - 15} 9,${boxSize - 8}"
                fill="${fillColor}"
                fill-opacity="${SELF_ICON_FILL_OPACITY}"
                transform="rotate(${heading} ${center} ${center})"
            />`;
	}
	if (variant === "boat") {
		const halfBeam = 12;
		const bowY = center - 26;
		const shoulderY = center - 11;
		const sternY = center + 19;
		return `
            <path
                d="M${center},${bowY} L${center + halfBeam},${shoulderY} L${center + halfBeam},${sternY} A12,10 0 0 1 ${center - halfBeam},${sternY} L${center - halfBeam},${shoulderY} Z"
                fill="${fillColor}"
                fill-opacity="${SELF_ICON_FILL_OPACITY}"
                transform="rotate(${heading} ${center} ${center})"
            />`;
	}
	if (variant === "diamond") {
		return `
            <path
                d="M${center},4 L${boxSize - 4},${center} L${center},${boxSize - 4} L4,${center} Z"
                fill="${fillColor}"
                fill-opacity="${SELF_ICON_FILL_OPACITY}"
            />
            <path d="M${center},${center - 12} v24 M${center - 12},${center} h24" stroke-width="${strokeWidth * 0.7}" />`;
	}
	if (variant === "dot") {
		return `
            <circle cx="${center}" cy="${center}" r="7" fill="${fillColor}" fill-opacity="${SELF_ICON_DOT_FILL_OPACITY}" />
            <circle cx="${center}" cy="${center}" r="17" />
            <path
                d="M${center},${center - 17} v10"
                transform="rotate(${heading} ${center} ${center})"
            />`;
	}
	return `
            <circle cx="${center}" cy="${center}" r="17" />
            <circle cx="${center}" cy="${center}" r="7" />`;
}
