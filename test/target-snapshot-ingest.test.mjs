import assert from "node:assert/strict";
import test from "node:test";
import { ingestRawVesselData } from "../src/web/assets/scripts/target-snapshot-ingest.mjs";

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
