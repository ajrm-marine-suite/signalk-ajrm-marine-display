/**
 * Implements the target map renderer selected details responsibilities of the AJRM Marine Display browser application.
 */

import { activateBootstrapTooltips } from "./bootstrap-tooltips.mjs";
import { renderSelectedVesselDetails } from "./selected-vessel-details.mjs";

export function updateRendererSelectedVesselDetails({
	document,
	target,
	targetSilence,
	isSelf = false,
	renderDetails = renderSelectedVesselDetails,
	activateTooltips = activateBootstrapTooltips,
}) {
	return renderDetails({
		target,
		targetSilence,
		isSelf,
		activateToolTips: () => activateTooltips({ document }),
	});
}
