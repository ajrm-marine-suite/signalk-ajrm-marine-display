export function applyEngineTargetProjection({ targets, projection }) {
	if (!projection || typeof projection !== "object") return 0;
	let applied = 0;
	for (const [mmsi, projected] of Object.entries(projection)) {
		const target = targets.get(String(mmsi));
		if (!target || !projected || typeof projected !== "object") continue;
		Object.assign(target, projected, {
			mmsi: String(mmsi),
			isValid: projected.isValid !== false,
		});
		applied += 1;
	}
	return applied;
}
