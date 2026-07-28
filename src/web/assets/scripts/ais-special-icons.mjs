import { createAisDivIcon } from "./ais-icon-utils.mjs";
import { toDegrees } from "../../../shared/ais-utils.mjs";

const SELF_ICON_FILL_OPACITY = "0.6";
const SELF_ICON_DOT_FILL_OPACITY = "0.7";
const DIRECTIONAL_SELF_ICON_VARIANTS = new Set(["triangle", "boat", "dot"]);

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
	scalePercent = 100,
	orientation = "heading",
) {
	const headingDegrees = toDegrees(resolveSelfIconDirection(target, orientation));
	const hasDirection = Number.isFinite(headingDegrees);
	const displayVariant =
		hasDirection || !DIRECTIONAL_SELF_ICON_VARIANTS.has(variant)
			? variant
			: "rings";
	const baseBoxSize = variant === "boat" ? 60 : 40;
	const boxSize = Math.round(
		baseBoxSize * normalizeSelfIconScale(scalePercent),
	);
	var strokeWidth = 2;
	const center = baseBoxSize / 2;
	const heading = Number.isFinite(headingDegrees) ? headingDegrees : 0;
	const shape = getSelfIconShape({
		boxSize: baseBoxSize,
		center,
		fillColor,
		heading,
		strokeWidth,
		variant: displayVariant,
	});

	const SVGIcon = `
    <svg width="${boxSize}px" height="${boxSize}px" viewBox="0 0 ${baseBoxSize} ${baseBoxSize}" pointerEvents="none">
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

function resolveSelfIconDirection(target, orientation) {
	const cog = Number.isFinite(target?.cog) ? target.cog : undefined;
	if (orientation === "cog") return cog;
	return Number.isFinite(target?.hdg) ? target.hdg : cog;
}

function normalizeSelfIconScale(value) {
	const number = Number(value);
	if (!Number.isFinite(number)) return 1;
	return Math.min(150, Math.max(50, number)) / 100;
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
