export function safeTimestamp(now) {
	try {
		return now();
	} catch {
		return new Date().toISOString();
	}
}

export function serializeChartStartupError(error) {
	if (!error) return { message: "Unknown chart startup error" };
	return {
		name: error.name || "Error",
		message: error.message || String(error),
		stack: error.stack || "",
	};
}

export function appendChartDiagnosticEntry(target, entry, limit) {
	if (!Array.isArray(target.entries)) target.entries = [];
	target.entries.push(entry);
	if (target.entries.length > limit) {
		target.entries.splice(0, target.entries.length - limit);
	}
	target.last = entry;
	return entry;
}
