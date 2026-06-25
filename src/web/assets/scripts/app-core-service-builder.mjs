import {
	coreFeedbackConfig,
	coreHttpConfig,
	coreProfileServiceConfig,
} from "./app-service-builder-configs.mjs";

export function createCoreAppServices({
	createFeedback,
	createHttp,
	createProfileService,
	elements,
	modals,
	pluginId,
	defaultCollisionProfiles,
}) {
	const feedback = createFeedback(coreFeedbackConfig({ elements, modals }));
	const { getHttpResponse } = createHttp(coreHttpConfig({ feedback }));
	const collisionProfileService = createProfileService(coreProfileServiceConfig({
		pluginId,
		getHttpResponse,
		defaultCollisionProfiles,
	}));

	return {
		feedback,
		getHttpResponse,
		collisionProfileService,
	};
}
