import NoSleep from "nosleep.js";
import {
	colorModeState,
	fullscreenChecked,
	storedCheckboxValue,
} from "./display-settings-state.mjs";
import { SETTINGS_STORAGE_KEYS } from "./settings-storage-keys.mjs";
import {
	loadSelfTcpaGuideSettings,
	saveSelfTcpaGuideSettings,
} from "./self-tcpa-guide-settings.mjs";

export function createDisplaySettingsController({
	controls,
	onFullscreenToggled = () => {},
}) {
	const noSleep = new NoSleep();

	function init() {
		controls.darkMode.checked = storedCheckboxValue(
			localStorage,
			SETTINGS_STORAGE_KEYS.darkMode,
		);
		controls.noSleep.checked = storedCheckboxValue(
			localStorage,
			SETTINGS_STORAGE_KEYS.noSleep,
		);
		configureNoSleep();
		applySelfTcpaGuideSettings();
		applyColorMode();
		controls.noSleep.addEventListener("change", configureNoSleep);
		controls.darkMode.addEventListener("change", applyColorMode);
		for (const control of selfTcpaGuideControls()) {
			control.addEventListener("change", saveSelfTcpaGuideControls);
		}
		controls.fullScreen.addEventListener("change", toggleFullscreen);
		document.addEventListener("fullscreenchange", fullscreenchangeHandler);
	}

	function fullscreenchangeHandler() {
		controls.fullScreen.checked = fullscreenChecked(document.fullscreenElement);
	}

	function applyColorMode() {
		const state = colorModeState(controls.darkMode.checked);
		document.documentElement.setAttribute("data-bs-theme", state.theme);
		for (const element of document.querySelectorAll(".leaflet-layer")) {
			element.style.filter = state.mapFilter;
		}
		localStorage.setItem(
			SETTINGS_STORAGE_KEYS.darkMode,
			controls.darkMode.checked,
		);
	}

	function configureNoSleep() {
		if (controls.noSleep.checked) {
			noSleep.enable();
		} else {
			noSleep.disable();
		}
		localStorage.setItem(SETTINGS_STORAGE_KEYS.noSleep, controls.noSleep.checked);
	}

	function applySelfTcpaGuideSettings() {
		if (!controls.selfTcpaGuideMode) return;
		const settings = loadSelfTcpaGuideSettings();
		controls.selfIconVariant.value = settings.selfIcon;
		controls.selfIconFillColor.value = settings.selfIconFillColor;
		controls.selfTcpaGuideMode.value = settings.mode;
		controls.selfTcpaGuideLargeColor.value = settings.largeColor;
		controls.selfTcpaGuideMediumColor.value = settings.mediumColor;
		controls.selfTcpaGuideSmallColor.value = settings.smallColor;
	}

	function saveSelfTcpaGuideControls() {
		if (!controls.selfTcpaGuideMode) return;
		saveSelfTcpaGuideSettings({
			selfIcon: controls.selfIconVariant.value,
			selfIconFillColor: controls.selfIconFillColor.value,
			mode: controls.selfTcpaGuideMode.value,
			largeColor: controls.selfTcpaGuideLargeColor.value,
			mediumColor: controls.selfTcpaGuideMediumColor.value,
			smallColor: controls.selfTcpaGuideSmallColor.value,
		});
	}

	function selfTcpaGuideControls() {
		return [
			controls.selfIconVariant,
			controls.selfIconFillColor,
			controls.selfTcpaGuideMode,
			controls.selfTcpaGuideLargeColor,
			controls.selfTcpaGuideMediumColor,
			controls.selfTcpaGuideSmallColor,
		].filter(Boolean);
	}

	function toggleFullscreen() {
		if (controls.fullScreen.checked) {
			if (!document.fullscreenElement) {
				document.documentElement.requestFullscreen();
			} else if (!document.webkitFullscreenElement) {
				document.documentElement.webkitRequestFullscreen();
			}
		} else if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
		onFullscreenToggled();
	}

	return {
		applyColorMode,
		applySelfTcpaGuideSettings,
		configureNoSleep,
		fullscreenchangeHandler,
		init,
		saveSelfTcpaGuideControls,
		toggleFullscreen,
	};
}
