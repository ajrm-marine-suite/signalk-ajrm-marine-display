/**
 * Implements the AIS special icons responsibilities of the AJRM Marine Display browser application.
 */

import { createAisDivIcon } from "./ais-icon-utils.mjs";
import { toDegrees } from "../../../shared/angles.mjs";

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

export function getAircraftIcon(target = {}, isLarge = false, color = "black") {
	const boxSize = isLarge ? 70 : 50;
	const headingDegrees = toDegrees(target?.hdg ?? target?.cog);
	const heading = Number.isFinite(headingDegrees) ? headingDegrees : 0;
	const lostCross = target?.isLost
		? `<path d="M8,8 L42,42 M42,8 L8,42" stroke="red" stroke-width="3" />`
		: "";
	const SVGIcon = `
    <svg width="${boxSize}px" height="${boxSize}px" viewBox="0 0 50 50" pointerEvents="none">
        <g transform="rotate(${heading} 25 25)" pointer-events="all">
            <path
                class="ajrm-marine-sar-aircraft"
                d="M25,3 C22.8,7 22.8,12 23,17 L7,27 L7,32 L23,27 L23,40 L17,45 L17,48 L25,45 L33,48 L33,45 L27,40 L27,27 L43,32 L43,27 L27,17 C27.2,12 27.2,7 25,3 Z"
                fill="${color}"
                stroke="#ffffff"
                stroke-width="1.5"
                stroke-opacity="0.9"
                stroke-linejoin="round"
            />
        </g>
        ${lostCross}
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
	const stale = target?.isStale === true || target?.isLost === true;
	const displayFillColor = stale ? "#9ca3af" : fillColor;
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
		fillColor: displayFillColor,
		heading,
		strokeWidth,
		variant: displayVariant,
	});
	const staleOverlay = stale
		? `<path
			d="M7,7 L${baseBoxSize - 7},${baseBoxSize - 7} M${baseBoxSize - 7},7 L7,${baseBoxSize - 7}"
			stroke="#dc2626"
			stroke-width="3"
			stroke-linecap="round"
			fill="none"
		/>`
		: "";

	const SVGIcon = `
    <svg width="${boxSize}px" height="${boxSize}px" viewBox="0 0 ${baseBoxSize} ${baseBoxSize}" pointerEvents="none">
        <g
            fill-opacity=0
            stroke-width=${strokeWidth}
            stroke="${stale ? "#6b7280" : "gray"}"
            stroke-opacity=1
		>
			${shape}
		</g>
		${staleOverlay}
	</svg>`;

	return createAisDivIcon({ html: SVGIcon, boxSize });
}

function resolveSelfIconDirection(target, orientation) {
	const cog = Number.isFinite(target?.cog)
		? target.cog
		: target?.lastKnownCog;
	if (orientation === "cog") return cog;
	return Number.isFinite(target?.hdg)
		? target.hdg
		: Number.isFinite(target?.lastKnownHdg)
			? target.lastKnownHdg
			: cog;
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
