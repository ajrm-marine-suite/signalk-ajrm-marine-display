import assert from "node:assert/strict";
import test from "node:test";
import {
	SELF_TCPA_GUIDE_DEFAULTS,
	SELF_TCPA_GUIDE_STORAGE_KEYS,
	loadSelfTcpaGuideSettings,
	normalizeSelfTcpaGuideSettings,
	saveSelfTcpaGuideSettings,
} from "../src/web/assets/scripts/self-tcpa-guide-settings.mjs";

test("own-vessel icon scale defaults to 100 percent and clamps to 50-150", () => {
	assert.equal(
		normalizeSelfTcpaGuideSettings({}).selfIconScalePercent,
		SELF_TCPA_GUIDE_DEFAULTS.selfIconScalePercent,
	);
	assert.equal(
		normalizeSelfTcpaGuideSettings({ selfIconScalePercent: 20 })
			.selfIconScalePercent,
		50,
	);
	assert.equal(
		normalizeSelfTcpaGuideSettings({ selfIconScalePercent: 200 })
			.selfIconScalePercent,
		150,
	);
	assert.equal(
		normalizeSelfTcpaGuideSettings({ selfIconScalePercent: "65" })
			.selfIconScalePercent,
		65,
	);
});

test("own-vessel icon scale persists with the other local appearance settings", () => {
	const values = new Map();
	const storage = {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, String(value)),
	};

	saveSelfTcpaGuideSettings(
		{
			selfIcon: "boat",
			selfIconFillColor: "#123456",
			selfIconScalePercent: 60,
		},
		storage,
	);

	assert.equal(
		values.get(SELF_TCPA_GUIDE_STORAGE_KEYS.selfIconScalePercent),
		"60",
	);
	assert.equal(loadSelfTcpaGuideSettings(storage).selfIconScalePercent, 60);
});
