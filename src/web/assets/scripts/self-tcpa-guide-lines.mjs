import { projectedLocation } from "./map-geometry.mjs";
import { criteriaForSize } from "./profile-settings.mjs";
import {
	loadSelfTcpaGuideSettings,
	normalizeSelfTcpaGuideSettings,
} from "./self-tcpa-guide-settings.mjs";

const GUIDE_SIZES = Object.freeze([
	{ key: "large", colorKey: "largeColor", weight: 8 },
	{ key: "medium", colorKey: "mediumColor", weight: 6 },
	{ key: "small", colorKey: "smallColor", weight: 4 },
]);

export function updateSelfTcpaGuideLines({
	line,
	target,
	map,
	L,
	collisionProfiles,
	settings = loadSelfTcpaGuideSettings(),
}) {
	const guideSettings = normalizeSelfTcpaGuideSettings(settings);
	const guides = ensureGuideLines({ line, map, L });
	if (guideSettings.mode !== "tcpa" || !target?.isValid) {
		hideSelfTcpaGuideLines(guides);
		return false;
	}

	const profile = collisionProfiles?.[collisionProfiles?.current] || {};
	const tcpaLookahead = finiteOr(profile.tcpaLookahead, 1);
	const start = [target.latitude, target.longitude];
	const sog = finiteOr(target.sog, 0);
	if (sog <= 0) {
		hideSelfTcpaGuideLines(guides);
		return true;
	}

	for (const guide of guides) {
		const criteria = criteriaForSize(profile, "warning", guide.key);
		const seconds = Math.max(0, finiteOr(criteria.tcpa, 0) * tcpaLookahead);
		const end = projectedLocation(start, target.cog || 0, sog * seconds);
		updateGuideLine({
			guide,
			map,
			state: {
				kind: "self-tcpa-guide",
				start,
				end,
				color: guideSettings[guide.colorKey],
				opacity: 0.85,
				dashArray: "",
				weight: guide.weight,
			},
		});
	}
	return true;
}

export function hideSelfTcpaGuideLines(guidesOrLine) {
	const guides = Array.isArray(guidesOrLine)
		? guidesOrLine
		: guidesOrLine?._ajrmMarineSelfTcpaGuideLines || [];
	for (const guide of guides) {
		const guideLine = guide.line || guide;
		if (guideLine._ajrmMarineCourseLineState == null) continue;
		guideLine.setLatLngs([]);
		guideLine._ajrmMarineCourseLineState = null;
	}
}

export function ensureGuideLines({ line, map, L }) {
	if (line._ajrmMarineSelfTcpaGuideLines) return line._ajrmMarineSelfTcpaGuideLines;
	line._ajrmMarineSelfTcpaGuideLines = GUIDE_SIZES.map((guide, index) => ({
		...guide,
		line: index === 0
			? line
			: L.polyline([], {
				color: "gray",
				opacity: 0.7,
				interactive: false,
				weight: guide.weight,
			}).addTo(map),
	}));
	return line._ajrmMarineSelfTcpaGuideLines;
}

function finiteOr(value, fallback) {
	const numeric = Number(value);
	return Number.isFinite(numeric) ? numeric : fallback;
}

function updateGuideLine({ guide, map, state }) {
	const line = guide.line;
	const changed = !sameGuideLineState(line._ajrmMarineCourseLineState, state);
	if (changed) {
		line.setLatLngs([state.start, state.end]);
		line.setStyle({
			color: state.color,
			opacity: state.opacity,
			interactive: false,
			dashArray: state.dashArray,
			weight: state.weight,
		});
		line._ajrmMarineCourseLineState = state;
	}
	const added = !map.hasLayer(line);
	if (added) line.addTo(map);
	if (changed || added) line.bringToFront?.();
}

function sameGuideLineState(previous, next) {
	return (
		previous?.kind === next.kind &&
		previous?.color === next.color &&
		previous?.opacity === next.opacity &&
		previous?.dashArray === next.dashArray &&
		previous?.weight === next.weight &&
		sameLatLng(previous?.start, next.start) &&
		sameLatLng(previous?.end, next.end)
	);
}

function sameLatLng(previous, next) {
	return previous?.[0] === next?.[0] && previous?.[1] === next?.[1];
}
