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
