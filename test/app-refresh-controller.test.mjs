import assert from "node:assert/strict";
import test from "node:test";

import {
	replayStatusFromAjrmMarineLogger,
	replayStatusFromSignalKVessels,
} from "../src/web/assets/scripts/app-refresh-controller.mjs";

test("replay status follows the explicit active flag without requiring a timestamp", () => {
	const status = replayStatusFromAjrmMarineLogger({
		playback: {
			active: true,
			fileName: "voyage.jsonl",
		},
	});

	assert.equal(status.active, true);
	assert.equal(status.fileName, "voyage.jsonl");
	assert.equal(status.replayTimeMs, null);
});

test("replay status reads explicit Logger playback state from Signal K vessels", () => {
	const status = replayStatusFromSignalKVessels({
		self: {
			plugins: {
				ajrmMarineLogger: {
					playback: {
						value: {
							active: true,
							paused: true,
							current: "2026-07-08T12:00:00.000Z",
							rate: 4,
						},
					},
				},
			},
		},
	});

	assert.equal(status.active, true);
	assert.equal(status.paused, true);
	assert.equal(status.rate, 4);
	assert.equal(status.replayTimeMs, Date.parse("2026-07-08T12:00:00.000Z"));
});
