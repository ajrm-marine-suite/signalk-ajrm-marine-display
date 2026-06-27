export function applyTrafficTargetProjection({ targets, projection }) {
	if (!projection || typeof projection !== "object") return 0;
	let applied = 0;
	for (const [mmsi, projected] of Object.entries(projection)) {
		const target = targets.get(String(mmsi));
		if (!target || !projected || typeof projected !== "object") continue;
		Object.assign(target, preservedStaticTargetFields(target, projected), {
			mmsi: String(mmsi),
			isValid: projected.isValid !== false,
		});
		applied += 1;
	}
	return applied;
}

function preservedStaticTargetFields(target, projected) {
	const next = { ...projected };
	const hasProjectedLength = Number.isFinite(Number(projected.length));
	const hasProjectedBeam = Number.isFinite(Number(projected.beam));
	if (!hasProjectedLength && Number.isFinite(Number(target.length))) {
		next.length = target.length;
	}
	if (!hasProjectedBeam && Number.isFinite(Number(target.beam))) {
		next.beam = target.beam;
	}
	if (
		(!hasProjectedLength || !hasProjectedBeam) &&
		target.sizeFormatted &&
		/^--- m x --- m$/.test(String(projected.sizeFormatted || ""))
	) {
		next.sizeFormatted = target.sizeFormatted;
	}
	if (
		!projected.vesselFootprintSourceFormatted &&
		target.vesselFootprintSourceFormatted
	) {
		next.vesselFootprintSourceFormatted = target.vesselFootprintSourceFormatted;
	}
	return next;
}
