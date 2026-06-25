import {
	silencedAlertMessage,
	unsilencedTargetMessage,
} from "./target-silence-state.mjs";
import {
	fetchTargetsForSilence,
	requestSetTargetSilence,
	requestSilenceCurrentAlerts,
	requestUnsilenceAllTargets,
} from "./target-silence-requests.mjs";
import {
	applyTargetSilenceServerTargets,
	refreshTargetSilenceStateAction,
	toggleTargetSilenceAction,
} from "./target-silence-controller-actions.mjs";

export function createTargetSilenceControllerCommands({
	pluginId,
	targets,
	getSelectedVesselMmsi,
	getHttpResponse,
	updateTargetFromServer,
	refreshServerAlertEvents,
	updateTableOfTargets,
	showAlert,
}) {
	async function refreshTargetMuteState() {
		try {
			await refreshTargetSilenceStateAction({
				fetchTargets: () =>
					fetchTargetsForSilence({
						getHttpResponse,
						pluginId,
					}),
				updateTargetFromServer,
				refreshServerAlertEvents,
				updateTableOfTargets,
			});
		} catch (error) {
			console.error("Error refreshing target mute state", error);
		}
	}

	async function silenceCurrentAlerts() {
		const response = await requestSilenceCurrentAlerts({
			getHttpResponse,
			pluginId,
		});
		await applyTargetSilenceServerTargets({
			serverTargets: response?.targets,
			updateTargetFromServer,
			alarmIsMuted: true,
			refreshServerAlertEvents,
			updateTableOfTargets,
		});
		showAlert(silencedAlertMessage(response?.silenced), "success");
	}

	async function unsilenceAllTargets() {
		const response = await requestUnsilenceAllTargets({
			getHttpResponse,
			pluginId,
		});
		await applyTargetSilenceServerTargets({
			serverTargets: response?.targets,
			updateTargetFromServer,
			alarmIsMuted: false,
			refreshServerAlertEvents,
			updateTableOfTargets,
		});
		showAlert(unsilencedTargetMessage(response?.unsilenced), "success");
	}

	async function handleButtonMuteToggle() {
		const target = targets.get(getSelectedVesselMmsi());
		const updated = await toggleTargetSilenceAction({
			target,
			requestSetTargetSilence: (body) =>
				requestSetTargetSilence({
					getHttpResponse,
					pluginId,
					...body,
				}),
			updateTargetFromServer,
			refreshServerAlertEvents,
			updateTableOfTargets,
		});
		if (!updated) return;
		showAlert(
			`Target ${updated.alarmIsMuted ? "silenced" : "unsilenced"}`,
			"success",
		);
	}

	return {
		handleButtonMuteToggle,
		refreshTargetMuteState,
		silenceCurrentAlerts,
		unsilenceAllTargets,
	};
}
