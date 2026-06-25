import { muteStatusText } from "./speech-output-state.mjs";
import { applyMuteButtonState } from "./speech-output-view-state.mjs";

export function createSpeechOutputMuteController({
	controls,
	announceSoundState = async () => {},
	getServerSpeechOutputSettings = () => null,
	saveSettings,
}) {
	function updateMuteControlState() {
		applyMuteButtonState({
			mutedControl: controls.muted,
			muteButton: controls.muteButton,
		});
	}

	function updateMuteStatus({ preferServer = true } = {}) {
		updateMuteControlState();
		if (!controls.muteStatus) return;
		const serverSettings = preferServer ? getServerSpeechOutputSettings() : null;
		if (serverSettings?.muteStatus) {
			controls.muteStatus.textContent = serverSettings.muteStatus;
			return;
		}
		controls.muteStatus.textContent = muteStatusText({
			muted: controls.muted.checked,
		});
	}

	function refreshMuteStatus({ force = false } = {}) {
		void force;
		updateMuteControlState();
		updateMuteStatus();
		return undefined;
	}

	function handleManualMuteChange() {
		const saveThenAnnounce = Promise.resolve(saveSettings())
			.then((saved) => {
				if (saved === false) return;
				return announceSoundState({
					muted: controls.muted.checked,
				});
			})
			.catch((error) => {
				console.error("Error saving or announcing sound state", error);
			});
		updateMuteStatus({ preferServer: false });
		return saveThenAnnounce;
	}

	function handleAutomuteChange() {
		const saveThenUpdate = Promise.resolve(saveSettings()).catch((error) => {
			console.error("Error saving automute setting", error);
		});
		updateMuteStatus({ preferServer: false });
		return saveThenUpdate;
	}

	return {
		handleAutomuteChange,
		handleManualMuteChange,
		refreshMuteStatus,
		updateMuteControlState,
		updateMuteStatus,
	};
}
