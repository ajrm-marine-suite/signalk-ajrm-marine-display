import { createAppHttp } from "./app-http.mjs";
import { createAlertPopupController } from "./alert-popup.mjs";
import { createAutoProfileSettingsController } from "./auto-profile-settings.mjs";
import { createCollisionProfileService } from "./collision-profile-service.mjs";
import { createFeedbackController } from "./feedback-ui.mjs";
import { createGpsLossPopupController } from "./gps-loss-popup.mjs";
import { createProfileActions } from "./profile-actions.mjs";
import { createConfiguredProfileEditController } from "./profile-edit-setup.mjs";
import { createServerAlertEventsController } from "./server-alert-events-controller.mjs";
import { createSpeechOutputController } from "./speech-output-controls.mjs";

export function getRequiredElementByDocument(documentRef, id) {
	const el = documentRef.getElementById(id);
	if (!el) {
		throw new Error(`Missing required element: ${id}`);
	}
	return el;
}

export function resolveAppServiceFactories(factories = {}) {
	return {
		createFeedback: factories.createFeedbackController ?? createFeedbackController,
		createHttp: factories.createAppHttp ?? createAppHttp,
		createProfileService:
			factories.createCollisionProfileService ?? createCollisionProfileService,
		createGpsLossPopup:
			factories.createGpsLossPopupController ?? createGpsLossPopupController,
		createServerAlertEvents:
			factories.createServerAlertEventsController ??
			createServerAlertEventsController,
		createSpeechOutput:
			factories.createSpeechOutputController ?? createSpeechOutputController,
		createAlertPopup:
			factories.createAlertPopupController ?? createAlertPopupController,
		createAutoProfileSettings:
			factories.createAutoProfileSettingsController ??
			createAutoProfileSettingsController,
		createProfileActionSet: factories.createProfileActions ?? createProfileActions,
		createProfileEdit:
			factories.createConfiguredProfileEditController ??
			createConfiguredProfileEditController,
		getRequiredElement: factories.getRequiredElement,
	};
}
