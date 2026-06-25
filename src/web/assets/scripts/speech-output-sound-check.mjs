import { speakAndLogBrowserSoundCheck } from "./browser-speech-actions.mjs";
import { shouldUseBrowserSpeech } from "./browser-speech-state.mjs";
import { sendPiSoundCheck } from "./speech-output-requests.mjs";
import {
	SOUND_CHECK_MESSAGE,
	soundCheckAlertState,
} from "./speech-output-ui-state.mjs";

export async function runSoundCheck({
	controls,
	pluginId,
	fetchFn,
	showAlert,
	windowObject,
	Utterance,
}) {
	const message = SOUND_CHECK_MESSAGE;
	let sent = false;
	let failed = false;
	if (controls.muted.checked) {
		showAlert("Sound check skipped because all sounds are muted", "warning");
		return;
	}
	if (
		shouldUseBrowserSpeech({
			muted: controls.muted.checked,
			browserChecked: controls.browser.checked,
			windowObject,
		})
	) {
		speakAndLogBrowserSoundCheck({
			fetchFn,
			pluginId,
			message,
			windowObject,
			Utterance,
		});
		sent = true;
	}
	if (controls.pi.checked) {
		try {
			await sendPiSoundCheck({ fetchFn, pluginId, message });
			sent = true;
		} catch (error) {
			failed = true;
			console.error("Sound check failed", error);
		}
	}
	const alert = soundCheckAlertState({ sent, failed });
	showAlert(alert.message, alert.type);
}
