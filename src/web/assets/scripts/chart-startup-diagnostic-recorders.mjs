export function recordChartDiagnostic(diagnostics, step, details = {}) {
	try {
		diagnostics?.record?.(step, details);
	} catch {
		// Diagnostics must never be able to break chart startup.
	}
}

export function recordChartDiagnosticError(
	diagnostics,
	step,
	error,
	details = {},
) {
	try {
		diagnostics?.error?.(step, error, details);
	} catch {
		// Diagnostics must never be able to mask the real startup error.
	}
}
