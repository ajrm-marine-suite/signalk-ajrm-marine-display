import { activateBootstrapTooltips } from "./bootstrap-tooltips.mjs";
import { renderSelectedVesselDetails } from "./selected-vessel-details.mjs";

export function updateRendererSelectedVesselDetails({
	document,
	target,
	targetSilence,
	renderDetails = renderSelectedVesselDetails,
	activateTooltips = activateBootstrapTooltips,
}) {
	return renderDetails({
		target,
		targetSilence,
		activateToolTips: () => activateTooltips({ document }),
	});
}
