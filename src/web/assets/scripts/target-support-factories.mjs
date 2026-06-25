import { createMapLabelCollisionController } from "./map-label-collision.mjs";
import { createRangeRingsController } from "./range-rings.mjs";
import { createSelectionMarkers } from "./selection-markers.mjs";
import { createTargetOverlayController } from "./target-overlays.mjs";
import { createConfiguredTargetSilenceController } from "./target-silence-setup.mjs";

export function resolveTargetSupportFactories(factories = {}) {
	return {
		createTargetSilence:
			factories.createConfiguredTargetSilenceController ??
			createConfiguredTargetSilenceController,
		createRangeRings:
			factories.createRangeRingsController ?? createRangeRingsController,
		createTargetOverlays:
			factories.createTargetOverlayController ?? createTargetOverlayController,
		createSelection: factories.createSelectionMarkers ?? createSelectionMarkers,
		createLabelCollision:
			factories.createMapLabelCollisionController ??
			createMapLabelCollisionController,
	};
}
