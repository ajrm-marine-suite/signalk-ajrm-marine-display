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
		applyAudioModeState();
	}

	function audioModeFromControls() {
		if (controls.automute.checked) return "auto";
		return controls.muted.checked ? "off" : "on";
	}

	function applyAudioModeState() {
		const mode = audioModeFromControls();
		if (controls.audioModeAuto) controls.audioModeAuto.checked = mode === "auto";
		if (controls.audioModeOn) controls.audioModeOn.checked = mode === "on";
		if (controls.audioModeOff) controls.audioModeOff.checked = mode === "off";
		if (controls.audioModeStatus) {
			controls.audioModeStatus.textContent = controls.muteStatus?.textContent || "";
		}
	}

	function updateMuteStatus({ preferServer = true } = {}) {
		updateMuteControlState();
		if (!controls.muteStatus) return;
		const serverSettings = preferServer ? getServerSpeechOutputSettings() : null;
		if (serverSettings?.muteStatus) {
			controls.muteStatus.textContent = serverSettings.muteStatus;
			applyAudioModeState();
			return;
		}
		controls.muteStatus.textContent = muteStatusText({
			muted: controls.muted.checked,
		});
		applyAudioModeState();
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

	function handleAudioModeChange(mode) {
		const previousMuted = controls.muted.checked;
		if (mode === "auto") {
			controls.muted.checked = false;
			controls.automute.checked = true;
		} else if (mode === "off") {
			controls.muted.checked = true;
			controls.automute.checked = false;
		} else {
			controls.muted.checked = false;
			controls.automute.checked = false;
		}
		updateMuteStatus({ preferServer: false });
		const saveThenAnnounce = Promise.resolve(saveSettings())
			.then((saved) => {
				if (saved === false || previousMuted === controls.muted.checked) return;
				return announceSoundState({
					muted: controls.muted.checked,
				});
			})
			.catch((error) => {
				console.error("Error saving audio mode", error);
			});
		return saveThenAnnounce;
	}

	return {
		handleAudioModeChange,
		handleAutomuteChange,
		handleManualMuteChange,
		refreshMuteStatus,
		updateMuteControlState,
		updateMuteStatus,
	};
}
