import { feedbackAlertHtml } from "./feedback-state.mjs";

export function createFeedbackController({
	alertPlaceholder,
	errorMessage,
	errorModal,
}) {
	function showAlert(message, type) {
		alertPlaceholder.innerHTML = feedbackAlertHtml(message, type);
	}

	function clearAlert() {
		alertPlaceholder.innerHTML = "";
	}

	function showError(message) {
		errorMessage.innerHTML = message;
		errorModal.show();
	}

	return {
		clearAlert,
		showAlert,
		showError,
	};
}
