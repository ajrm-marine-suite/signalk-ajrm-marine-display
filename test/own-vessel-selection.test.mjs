import assert from "node:assert/strict";
import test from "node:test";
import { createTargetMarkerBundle } from "../src/web/assets/scripts/target-marker-bundle.mjs";
import { handleTargetMarkerClick } from "../src/web/assets/scripts/target-selection-marker-click.mjs";
import { shouldSelectBoatMarker } from "../src/web/assets/scripts/target-selection-state.mjs";

test("own-vessel markers are clickable and selectable", () => {
	const handlers = new Map();
	const marker = {
		addTo() {
			return this;
		},
		bindTooltip() {},
		on(name, handler) {
			handlers.set(name, handler);
		},
	};
	const L = {
		marker() {
			return marker;
		},
		polyline() {
			return { addTo: () => ({}) };
		},
		polygon() {
			throw new Error("own vessel must not create an AIS footprint polygon");
		},
	};
	const boatClicked = () => {};

	createTargetMarkerBundle({
		L,
		map: {},
		target: { mmsi: "self" },
		selfMmsi: "self",
		targetSelection: { boatClicked },
		icon: {},
	});

	assert.equal(handlers.get("click"), boatClicked);
	assert.equal(
		shouldSelectBoatMarker({
			markerMmsi: "self",
			selectedVesselMmsi: null,
		}),
		true,
	);
});

test("own-vessel clicks bypass the nearby-target chooser", () => {
	const marker = { mmsi: "self" };
	const calls = [];

	handleTargetMarkerClick({
		event: { target: marker, latlng: { lat: 56, lng: -5 } },
		boatMarkers: new Map(),
		closebyListContainer: {},
		closebyModal: { show: () => calls.push("closeby") },
		map: {
			latLngToContainerPoint() {
				throw new Error("nearby-target lookup should not run for own vessel");
			},
		},
		metersPerNm: 1852,
		getSelfMmsi: () => "self",
		positionModalWindow: () => calls.push("position"),
		selectBoatMarker: (selected) => calls.push(["select", selected]),
		showSelectedVesselDetails: (selected) => calls.push(["show", selected]),
		targets: new Map(),
	});

	assert.deepEqual(calls, [
		["select", marker],
		["show", marker],
	]);
});
