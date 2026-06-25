export const SELF_TCPA_GUIDE_DEFAULTS = Object.freeze({
	mode: "course",
	selfIcon: "rings",
	selfIconFillColor: "#ff00ff",
	largeColor: "#000000",
	mediumColor: "#0d6efd",
	smallColor: "#198754",
});

export const SELF_TCPA_GUIDE_STORAGE_KEYS = Object.freeze({
	mode: "selfTcpaGuideMode",
	selfIcon: "selfIconVariant",
	selfIconFillColor: "selfIconFillColor",
	largeColor: "selfTcpaGuideLargeColor",
	mediumColor: "selfTcpaGuideMediumColor",
	smallColor: "selfTcpaGuideSmallColor",
});

const VALID_MODES = new Set(["course", "tcpa"]);
const VALID_SELF_ICONS = new Set([
	"rings",
	"crosshair",
	"triangle",
	"boat",
	"diamond",
	"dot",
]);

export function normalizeSelfTcpaGuideSettings(value = {}) {
	return {
		mode: VALID_MODES.has(value.mode) ? value.mode : SELF_TCPA_GUIDE_DEFAULTS.mode,
		selfIcon: VALID_SELF_ICONS.has(value.selfIcon)
			? value.selfIcon
			: SELF_TCPA_GUIDE_DEFAULTS.selfIcon,
		selfIconFillColor: normalizeColor(
			value.selfIconFillColor,
			SELF_TCPA_GUIDE_DEFAULTS.selfIconFillColor,
		),
		largeColor: normalizeColor(value.largeColor, SELF_TCPA_GUIDE_DEFAULTS.largeColor),
		mediumColor: normalizeColor(value.mediumColor, SELF_TCPA_GUIDE_DEFAULTS.mediumColor),
		smallColor: normalizeColor(value.smallColor, SELF_TCPA_GUIDE_DEFAULTS.smallColor),
	};
}

export function loadSelfTcpaGuideSettings(storage = localStorage) {
	return normalizeSelfTcpaGuideSettings({
		mode: storage.getItem(SELF_TCPA_GUIDE_STORAGE_KEYS.mode),
		selfIcon: storage.getItem(SELF_TCPA_GUIDE_STORAGE_KEYS.selfIcon),
		selfIconFillColor: storage.getItem(
			SELF_TCPA_GUIDE_STORAGE_KEYS.selfIconFillColor,
		),
		largeColor: storage.getItem(SELF_TCPA_GUIDE_STORAGE_KEYS.largeColor),
		mediumColor: storage.getItem(SELF_TCPA_GUIDE_STORAGE_KEYS.mediumColor),
		smallColor: storage.getItem(SELF_TCPA_GUIDE_STORAGE_KEYS.smallColor),
	});
}

export function saveSelfTcpaGuideSettings(settings, storage = localStorage) {
	const normalized = normalizeSelfTcpaGuideSettings(settings);
	storage.setItem(SELF_TCPA_GUIDE_STORAGE_KEYS.mode, normalized.mode);
	storage.setItem(SELF_TCPA_GUIDE_STORAGE_KEYS.selfIcon, normalized.selfIcon);
	storage.setItem(
		SELF_TCPA_GUIDE_STORAGE_KEYS.selfIconFillColor,
		normalized.selfIconFillColor,
	);
	storage.setItem(SELF_TCPA_GUIDE_STORAGE_KEYS.largeColor, normalized.largeColor);
	storage.setItem(SELF_TCPA_GUIDE_STORAGE_KEYS.mediumColor, normalized.mediumColor);
	storage.setItem(SELF_TCPA_GUIDE_STORAGE_KEYS.smallColor, normalized.smallColor);
	return normalized;
}

function normalizeColor(value, fallback) {
	return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? value : fallback;
}
