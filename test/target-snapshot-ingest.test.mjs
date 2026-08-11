import assert from "node:assert/strict";
import test from "node:test";
import { ingestRawVesselData } from "../src/web/assets/scripts/target-snapshot-ingest.mjs";

test("derives the MMSI country in the active vessel snapshot pipeline", () => {
	const timestamp = new Date().toISOString();
	const targets = new Map();

	ingestRawVesselData({
		vessels: {
			"232035943": {
				mmsi: { value: "232035943" },
				name: { value: "EVE" },
				navigation: {
					position: {
						value: { latitude: 56.018336, longitude: -5.6091328 },
						timestamp,
					},
				},
			},
		},
		targets,
		targetMaxAge: 30,
	});

	const eve = targets.get("232035943");
	assert.equal(eve?.mmsiCountryCode, "GB");
	assert.equal(
		eve?.mmsiCountryName,
		"United Kingdom of Great Britain and Northern Ireland",
	);
});

test("ingests own-vessel snapshots keyed by Signal K uuid when MMSI is absent", () => {
	const uuid = "urn:mrn:signalk:uuid:454fc872-a7aa-4f7a-bce4-fd63cbca53e0";
	const targets = new Map();

	ingestRawVesselData({
		vessels: {
			[uuid]: {
				uuid,
				navigation: {
					position: {
						value: {
							latitude: 56.21616,
							longitude: -5.56725,
						},
						timestamp: new Date().toISOString(),
					},
					speedOverGround: { value: 2.5 },
					courseOverGroundTrue: { value: Math.PI },
				},
			},
		},
		targets,
		targetMaxAge: 30,
	});

	const target = targets.get(uuid);
	assert.ok(target);
	assert.equal(target.mmsi, uuid);
	assert.equal(target.latitude, 56.21616);
	assert.equal(target.longitude, -5.56725);
	assert.equal(target.sog, 2.5);
	assert.equal(target.cog, Math.PI);
});

test("uses the vessel collection key for non-AIS snapshots without uuid", () => {
	const targets = new Map();

	ingestRawVesselData({
		vessels: {
			self: {
				navigation: {
					position: {
						value: {
							latitude: 56.2,
							longitude: -5.5,
						},
					},
				},
			},
		},
		targets,
		targetMaxAge: 30,
	});

	assert.equal(targets.get("self")?.mmsi, "self");
	assert.equal(targets.get("self")?.latitude, 56.2);
});

test("replay cleanup retains own vessel at its last position and removes other targets", () => {
	const timestamp = new Date().toISOString();
	const targets = new Map();
	ingestRawVesselData({
		vessels: {
			self: {
				navigation: {
					position: {
						value: { latitude: 56.21616, longitude: -5.56725 },
						timestamp,
					},
					speedOverGround: { value: 2.5 },
					courseOverGroundTrue: { value: Math.PI / 2 },
					headingTrue: { value: Math.PI / 3 },
				},
			},
			"235900010": {
				mmsi: { value: "235900010" },
				navigation: {
					position: {
						value: { latitude: 56.22, longitude: -5.56 },
						timestamp,
					},
				},
			},
		},
		targets,
		targetMaxAge: 30,
		selfMmsi: "self",
		removeMissing: true,
	});

	const result = ingestRawVesselData({
		vessels: {},
		targets,
		targetMaxAge: 30,
		selfMmsi: "self",
		removeMissing: true,
	});

	const self = targets.get("self");
	assert.ok(self);
	assert.equal(self.latitude, 56.21616);
	assert.equal(self.longitude, -5.56725);
	assert.equal(self.isStale, true);
	assert.equal(self.isLost, true);
	assert.equal(self.sog, undefined);
	assert.equal(self.cog, undefined);
	assert.equal(self.hdg, undefined);
	assert.equal(self.lastKnownCog, Math.PI / 2);
	assert.equal(self.lastKnownHdg, Math.PI / 3);
	assert.deepEqual(result.removedMmsis, ["235900010"]);
	assert.equal(targets.has("235900010"), false);
});

test("live GPS loss retains the last fix when the own-vessel context remains", () => {
	const timestamp = new Date().toISOString();
	const targets = new Map();
	ingestRawVesselData({
		vessels: {
			self: {
				navigation: {
					position: {
						value: { latitude: 56.21616, longitude: -5.56725 },
						timestamp,
					},
					courseOverGroundTrue: { value: Math.PI / 2 },
					headingTrue: { value: Math.PI / 3 },
				},
			},
		},
		targets,
		targetMaxAge: 30,
		selfMmsi: "self",
	});

	ingestRawVesselData({
		vessels: {
			self: {
				name: { value: "Example Yacht" },
				navigation: {
					position: { value: null },
					speedOverGround: { value: null },
				},
			},
		},
		targets,
		targetMaxAge: 30,
		selfMmsi: "self",
	});

	const self = targets.get("self");
	assert.equal(self.name, "Example Yacht");
	assert.equal(self.latitude, 56.21616);
	assert.equal(self.longitude, -5.56725);
	assert.equal(self.lastSeenDate.toISOString(), timestamp);
	assert.equal(self.isStale, true);
	assert.equal(self.isLost, true);
	assert.equal(self.sog, undefined);
	assert.equal(self.cog, undefined);
	assert.equal(self.hdg, undefined);
	assert.equal(self.lastKnownCog, Math.PI / 2);
	assert.equal(self.lastKnownHdg, Math.PI / 3);
});

test("live GPS loss retains the last fix when the own-vessel context disappears", () => {
	const timestamp = new Date().toISOString();
	const targets = new Map();
	ingestRawVesselData({
		vessels: {
			self: {
				navigation: {
					position: {
						value: { latitude: 56.21616, longitude: -5.56725 },
						timestamp,
					},
				},
			},
		},
		targets,
		targetMaxAge: 30,
		selfMmsi: "self",
	});

	ingestRawVesselData({
		vessels: {},
		targets,
		targetMaxAge: 30,
		selfMmsi: "self",
		removeMissing: false,
	});

	const self = targets.get("self");
	assert.equal(self.latitude, 56.21616);
	assert.equal(self.longitude, -5.56725);
	assert.equal(self.isStale, true);
	assert.equal(self.isLost, true);
});

test("a fresh Display page can render a stale Signal K own-vessel position", () => {
	const targets = new Map();
	ingestRawVesselData({
		vessels: {
			self: {
				navigation: {
					position: {
						value: { latitude: 56.21616, longitude: -5.56725 },
						timestamp: "2026-07-14T14:33:19.000Z",
					},
					courseOverGroundTrue: { value: Math.PI / 2 },
				},
			},
		},
		targets,
		targetMaxAge: 30,
		selfMmsi: "self",
		removeMissing: false,
	});

	const self = targets.get("self");
	assert.ok(self);
	assert.equal(self.latitude, 56.21616);
	assert.equal(self.isStale, true);
	assert.equal(self.lastKnownCog, Math.PI / 2);
});

test("a hard refresh restores the browser-cached live last fix after GPS loss", () => {
	const values = new Map();
	const storage = {
		getItem(key) {
			return values.get(key) ?? null;
		},
		setItem(key, value) {
			values.set(key, value);
		},
	};
	const timestamp = new Date().toISOString();
	const liveTargets = new Map();
	ingestRawVesselData({
		vessels: {
			self: {
				navigation: {
					position: {
						value: { latitude: 56.21616, longitude: -5.56725 },
						timestamp,
					},
					courseOverGroundTrue: { value: Math.PI / 2 },
					headingTrue: { value: Math.PI / 3 },
				},
			},
		},
		targets: liveTargets,
		targetMaxAge: 30,
		selfMmsi: "self",
		lastFixStorage: storage,
	});

	const refreshedTargets = new Map();
	ingestRawVesselData({
		vessels: {
			self: {
				name: { value: "Example Yacht" },
				navigation: { position: { value: null } },
			},
		},
		targets: refreshedTargets,
		targetMaxAge: 30,
		selfMmsi: "self",
		lastFixStorage: storage,
	});

	const self = refreshedTargets.get("self");
	assert.equal(self.name, "Example Yacht");
	assert.equal(self.latitude, 56.21616);
	assert.equal(self.longitude, -5.56725);
	assert.equal(self.lastSeenDate.toISOString(), timestamp);
	assert.equal(self.lastKnownCog, Math.PI / 2);
	assert.equal(self.lastKnownHdg, Math.PI / 3);
	assert.equal(self.isStale, true);
	assert.equal(self.isLost, true);

	const absentContextTargets = new Map();
	ingestRawVesselData({
		vessels: {},
		targets: absentContextTargets,
		targetMaxAge: 30,
		selfMmsi: "self",
		lastFixStorage: storage,
	});
	assert.equal(absentContextTargets.get("self").name, "Own vessel");
	assert.equal(absentContextTargets.get("self").latitude, 56.21616);
	assert.equal(absentContextTargets.get("self").longitude, -5.56725);
	assert.equal(absentContextTargets.get("self").isStale, true);
});

test("replay ingest neither restores nor replaces the browser-cached live fix", () => {
	const values = new Map();
	const storage = {
		getItem(key) {
			return values.get(key) ?? null;
		},
		setItem(key, value) {
			values.set(key, value);
		},
	};
	const liveTargets = new Map();
	ingestRawVesselData({
		vessels: {
			self: {
				navigation: {
					position: {
						value: { latitude: 56.21616, longitude: -5.56725 },
						timestamp: new Date().toISOString(),
					},
				},
			},
		},
		targets: liveTargets,
		targetMaxAge: 30,
		selfMmsi: "self",
		lastFixStorage: storage,
	});

	const replayTargets = new Map();
	ingestRawVesselData({
		vessels: {
			self: {
				navigation: {
					position: {
						value: { latitude: 50, longitude: -1 },
						timestamp: new Date().toISOString(),
					},
				},
			},
		},
		targets: replayTargets,
		targetMaxAge: 30,
		selfMmsi: "self",
		lastFixStorage: storage,
		storedSelfFixEnabled: false,
	});

	const refreshedTargets = new Map();
	ingestRawVesselData({
		vessels: {
			self: { navigation: { position: { value: null } } },
		},
		targets: refreshedTargets,
		targetMaxAge: 30,
		selfMmsi: "self",
		lastFixStorage: storage,
	});

	assert.equal(refreshedTargets.get("self").latitude, 56.21616);
	assert.equal(refreshedTargets.get("self").longitude, -5.56725);
});

test("uses Navigation Reference schema v1 as authoritative own motion", () => {
	const timestamp = new Date().toISOString();
	const targets = new Map();

	ingestRawVesselData({
		vessels: {
			self: {
				navigation: {
					position: {
						value: { latitude: 1, longitude: 2 },
						timestamp,
					},
					speedOverGround: { value: 9 },
					courseOverGroundTrue: { value: Math.PI / 2 },
					headingTrue: { value: Math.PI },
				},
				plugins: {
					ajrmMarineNavigationReference: {
						state: {
							value: navigationReferenceState({
								timestamp,
								heading: 0,
							}),
						},
					},
				},
			},
		},
		targets,
		targetMaxAge: 30,
	});

	const target = targets.get("self");
	assert.ok(target);
	assert.equal(target.latitude, 56.21616);
	assert.equal(target.longitude, -5.56725);
	assert.equal(target.sog, 2.5);
	assert.equal(target.cog, 1.25);
	assert.equal(target.hdg, 0);
	assert.equal(target.navigationReference?.valid, true);
	assert.equal(target.navigationReference?.groundTrack?.source, "YDEN.43");
	assert.equal(target.navigationReference?.clockReference?.kind, "heading");
});

test("does not mix raw own motion into a present provider contract", () => {
	const timestamp = new Date().toISOString();
	const targets = new Map();
	const state = navigationReferenceState({ timestamp, heading: 0.2 });

	ingestRawVesselData({
		vessels: {
			self: {
				navigation: rawNavigation(timestamp),
				plugins: {
					ajrmMarineNavigationReference: {
						state: { value: state },
					},
				},
			},
		},
		targets,
		targetMaxAge: 30,
	});

	state.groundTrack = null;
	state.bowHeadingTrue = null;
	state.clockReference = null;
	ingestRawVesselData({
		vessels: {
			self: {
				navigation: rawNavigation(timestamp),
				plugins: {
					ajrmMarineNavigationReference: {
						state: { value: state },
					},
				},
			},
		},
		targets,
		targetMaxAge: 30,
	});

	const target = targets.get("self");
	assert.equal(target.latitude, 56.21616);
	assert.equal(target.longitude, -5.56725);
	assert.equal(target.sog, undefined);
	assert.equal(target.cog, undefined);
	assert.equal(target.hdg, undefined);
	assert.equal(target.navigationReference?.valid, true);
});

test("keeps missing ground-track GPS dependency unknown", () => {
	const timestamp = new Date().toISOString();
	const targets = new Map();
	const state = navigationReferenceState({ timestamp, heading: 0 });
	delete state.groundTrack.gpsDependent;

	ingestRawVesselData({
		vessels: {
			self: {
				plugins: {
					ajrmMarineNavigationReference: {
						state: { value: state },
					},
				},
			},
		},
		targets,
		targetMaxAge: 30,
	});

	assert.equal(
		targets.get("self")?.navigationReference?.groundTrack?.gpsDependent,
		null,
	);
});

test("withholds raw own motion for invalid or unsupported provider contracts", () => {
	const timestamp = new Date().toISOString();
	for (const value of [
		{
			contract: "unexpected-provider",
			schemaVersion: 1,
		},
		{
			contract: "ajrm-marine-navigation-reference",
			schemaVersion: "1",
		},
		{
			contract: "ajrm-marine-navigation-reference",
			schemaVersion: 2,
		},
	]) {
		const targets = new Map();
		ingestRawVesselData({
			vessels: {
				self: {
					navigation: rawNavigation(timestamp),
					plugins: {
						ajrmMarineNavigationReference: {
							state: {
								value,
							},
						},
					},
				},
			},
			targets,
			targetMaxAge: 30,
		});

		const target = targets.get("self");
		assert.equal(target.latitude, undefined);
		assert.equal(target.longitude, undefined);
		assert.equal(target.sog, undefined);
		assert.equal(target.cog, undefined);
		assert.equal(target.hdg, undefined);
		assert.equal(target.navigationReference?.valid, false);
		assert.equal(target.navigationReference?.reason, "provider-contract-invalid");
	}
});

test("withholds raw own motion when provider updatedAt is missing, invalid, or stale", () => {
	const timestamp = new Date().toISOString();
	for (const updatedAt of [
		undefined,
		"not-a-timestamp",
		new Date(Date.now() - 60_000).toISOString(),
		new Date(Date.now() + 60_000).toISOString(),
	]) {
		const targets = new Map();
		const state = navigationReferenceState({ timestamp, heading: 0 });
		state.updatedAt = updatedAt;

		ingestRawVesselData({
			vessels: {
				self: {
					navigation: rawNavigation(timestamp),
					plugins: {
						ajrmMarineNavigationReference: {
							state: { value: state },
						},
					},
				},
			},
			targets,
			targetMaxAge: 30,
		});

		const target = targets.get("self");
		assert.equal(target.latitude, undefined);
		assert.equal(target.longitude, undefined);
		assert.equal(target.sog, undefined);
		assert.equal(target.cog, undefined);
		assert.equal(target.hdg, undefined);
		assert.equal(target.navigationReference?.valid, false);
		assert.ok(
			[
				"provider-state-stale",
				"provider-updated-at-invalid",
			].includes(target.navigationReference?.reason),
		);
	}
});

function navigationReferenceState({ timestamp, heading }) {
	const evidence = (value, method, gpsDependent = true) => ({
		value,
		source: "YDEN.43",
		sourceKind: "sensor",
		timestamp,
		ageMs: 0,
		method,
		uncertaintyRad: 0.05,
		gpsDependent,
	});
	return {
		contract: "ajrm-marine-navigation-reference",
		schemaVersion: 1,
		updatedAt: timestamp,
		status: "heading",
		position: evidence(
			{ latitude: 56.21616, longitude: -5.56725 },
			"coherent-gnss-position",
		),
		groundTrack: {
			source: "YDEN.43",
			timestamp,
			ageMs: 0,
			gpsDependent: true,
			coherent: true,
			courseTrue: evidence(1.25, "direct-ground-track"),
			speedOverGround: evidence(2.5, "direct-speed-over-ground"),
		},
		bowHeadingTrue: evidence(
			heading,
			"magnetic-heading-plus-wmm",
			false,
		),
		clockReference: {
			...evidence(heading, "magnetic-heading-plus-wmm", false),
			kind: "heading",
		},
	};
}

function rawNavigation(timestamp) {
	return {
		position: {
			value: { latitude: 1, longitude: 2 },
			timestamp,
		},
		speedOverGround: { value: 9 },
		courseOverGroundTrue: { value: Math.PI / 2 },
		headingTrue: { value: Math.PI },
	};
}
