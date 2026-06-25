import { getRequiredElementByDocument } from "./app-service-factories.mjs";
import { createConfiguredRefreshController } from "./refresh-controller-setup.mjs";
import { createTargetMapRenderer } from "./target-map-renderer.mjs";
import { createTargetSelectionController } from "./target-selection-controller.mjs";

export function resolveTargetUiFactories(factories = {}, documentRef) {
	return {
		createTargetSelection:
			factories.createTargetSelectionController ?? createTargetSelectionController,
		createRenderer: factories.createTargetMapRenderer ?? createTargetMapRenderer,
		createRefresh:
			factories.createConfiguredRefreshController ??
			createConfiguredRefreshController,
		requiredElement:
			factories.getRequiredElement ??
			((id) => getRequiredElementByDocument(documentRef, id)),
	};
}
