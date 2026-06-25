export function coreFeedbackConfig({ elements, modals }) {
	return {
		alertPlaceholder: elements.alertPlaceholder,
		errorMessage: elements.errorMessage,
		errorModal: modals.alert,
	};
}

export function coreHttpConfig({ feedback }) {
	return {
		onFatalError: feedback.showError,
	};
}

export function coreProfileServiceConfig({
	pluginId,
	defaultCollisionProfiles,
	getHttpResponse,
}) {
	return {
		pluginId,
		defaultProfiles: defaultCollisionProfiles,
		getHttpResponse,
	};
}
