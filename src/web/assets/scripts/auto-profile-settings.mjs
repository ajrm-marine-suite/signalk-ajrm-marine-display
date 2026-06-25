import {
	autoProfileSettingsPath,
	autoProfileStatusPath,
} from "./auto-profile-routes.mjs";
import {
	aisPlusAuthHeaders,
	assertAisPlusResponseAllowed,
} from "./ais-plus-api-access.mjs";
import {
	applyAutoProfileSettingsToControls,
	applyAutoProfileStatusToControls,
	autoProfileSettingsBody,
	autoProfileStatusFromResponse,
} from "./auto-profile-settings-view.mjs";
import {
	autoProfileStatusUiStateProjection,
	readHttpUiStateProjection,
} from "./ui-state-projection-reader.mjs";

export function createAutoProfileSettingsController({
	pluginId,
	controls,
	getCurrentProfile,
	setCurrentProfile,
	updateSensitivityControls,
	getHttpResponse,
}) {
	function setValidation(message, isError = false) {
		controls.validation.textContent = message || "";
		controls.validation.classList.toggle("text-danger", isError);
	}

	async function loadSettings() {
		try {
			const settings = await getHttpResponse(autoProfileSettingsPath(pluginId), {
				ignoreEmptyResponse: true,
			});
			applyAutoProfileSettingsToControls({ controls, settings });
			setValidation("");
		} catch (error) {
			console.error("Error loading auto profile settings", error);
		}
	}

	async function saveSettings() {
		setValidation("");
		try {
			const response = await fetch(autoProfileSettingsPath(pluginId), {
				credentials: "include",
				method: "POST",
				body: JSON.stringify(autoProfileSettingsBody({ controls })),
				headers: aisPlusAuthHeaders({ "Content-Type": "application/json" }),
			});
			if (!response.ok) {
				await assertAisPlusResponseAllowed(response, "AJRM Marine Auto Profile");
				const body = await response.json().catch(() => ({}));
				throw new Error(
					body.error || `Error saving auto profile settings: ${response.status}`,
				);
			}
			const body = await response.json().catch(() => ({}));
			applyStatus(autoProfileStatusFromResponse(body));
			await refreshStatus();
		} catch (error) {
			console.error("Error saving auto profile settings", error);
			setValidation(error.message, true);
		}
	}

	async function refreshStatus() {
		try {
			const status = await readAutoProfileStatus({
				pluginId,
				getHttpResponse,
			});
			applyStatus(status);
		} catch (error) {
			console.error("Error refreshing auto profile status", error);
		}
	}

	function refreshStatusFromUiState(uiState) {
		const status = autoProfileStatusUiStateProjection(uiState);
		if (!status) return false;
		applyStatus(status);
		return true;
	}

	function applyStatus(status) {
		applyAutoProfileStatusToControls({
			controls,
			status,
			currentProfile: getCurrentProfile(),
			setCurrentProfile,
			updateSensitivityControls,
		});
	}

	return {
		loadSettings,
		refreshStatus,
		refreshStatusFromUiState,
		saveSettings,
		setValidation,
	};
}

async function readAutoProfileStatus({ pluginId, getHttpResponse }) {
	const autoProfileStatus = await readHttpUiStateProjection({
		pluginId,
		getHttpResponse,
		projection: autoProfileStatusUiStateProjection,
	});
	if (autoProfileStatus) return autoProfileStatus;
	return getHttpResponse(autoProfileStatusPath(pluginId), {
		ignoreEmptyResponse: true,
	});
}
