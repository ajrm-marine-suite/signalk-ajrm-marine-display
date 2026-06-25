import {
	clearCourseLine,
	setProjectedCourseLine,
	setSelectedCourseLine,
} from "./course-lines.mjs";
import {
	hideSelfTcpaGuideLines,
	updateSelfTcpaGuideLines,
} from "./self-tcpa-guide-lines.mjs";

export function updateTargetCourseLine({
	target,
	selfMmsi,
	selectedVesselMmsi,
	targets,
	line,
	blueCircle1,
	blueCircle2,
	map,
	L,
	collisionProfiles,
	courseProjectionMinutes,
	vesselIcon,
	setSelectedCourseLineFn = setSelectedCourseLine,
	setProjectedCourseLineFn = setProjectedCourseLine,
	clearCourseLineFn = clearCourseLine,
	updateSelfTcpaGuideLinesFn = updateSelfTcpaGuideLines,
	hideSelfTcpaGuideLinesFn = hideSelfTcpaGuideLines,
}) {
	if (target.mmsi === selfMmsi && selectedVesselMmsi) {
		hideSelfTcpaGuideLinesFn(line);
		setSelectedCourseLineFn({
			line,
			start: [target.latitude, target.longitude],
			cog: target.cog,
			distance: (target.sog || 0) * (targets.get(selectedVesselMmsi).tcpa || 0),
			cpaMarker: blueCircle1,
			map,
		});
		return;
	}

	if (selectedVesselMmsi === target.mmsi) {
		hideSelfTcpaGuideLinesFn(line);
		setSelectedCourseLineFn({
			line,
			start: [target.latitude, target.longitude],
			cog: target.cog,
			distance: (target.sog || 0) * (target.tcpa || 0),
			cpaMarker: blueCircle2,
			map,
		});
		return;
	}

	if (shouldSuppressOwnVesselCourseLine({ target, selfMmsi, collisionProfiles })) {
		hideSelfTcpaGuideLinesFn(line);
		clearCourseLineFn(line);
		return;
	}

	if (target.mmsi === selfMmsi && updateSelfTcpaGuideLinesFn({
		line,
		target,
		map,
		L,
		collisionProfiles,
	})) {
		return;
	}

	hideSelfTcpaGuideLinesFn(line);

	setProjectedCourseLineFn({
		line,
		start: [target.latitude, target.longitude],
		cog: target.cog,
		distance: (target.sog || 0) * 60 * courseProjectionMinutes,
		color: vesselIcon.color,
	});
}

export function shouldSuppressOwnVesselCourseLine({
	target,
	selfMmsi,
	collisionProfiles,
}) {
	if (target?.mmsi !== selfMmsi) return false;
	if (!isStationaryProfile(collisionProfiles?.current)) return false;
	const sog = Number(target.sog);
	return Number.isFinite(sog) && sog <= 0.514444;
}

function isStationaryProfile(profileName) {
	const normalized = String(profileName || "").trim().toLowerCase();
	return (
		normalized === "anchor" ||
		normalized === "harbor" ||
		normalized === "harbour"
	);
}
