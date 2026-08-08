/**
 * Owns state and transitions for auto profile settings in the AJRM Marine Display browser application.
 */

export function autoProfileEnabledFromSettings(settings) {
	return settings?.enabled !== false;
}

export function autoProfileStatusClasses(status) {
	const disabled = status?.options?.enabled === false;
	return {
		warning: disabled,
		secondary: !disabled,
	};
}

export function shouldApplyAutoProfileStatus({ currentProfile, statusProfile }) {
	return Boolean(statusProfile && currentProfile !== statusProfile);
}
