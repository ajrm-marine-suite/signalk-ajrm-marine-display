/**
 * Coordinates target map renderer count in the AJRM Marine Display browser application.
 */

import { createTargetMapRendererCountState } from "./target-map-renderer-count-state.mjs";

export function createTargetMapRendererCountController({
	createCountState = createTargetMapRendererCountState,
} = {}) {
	const countState = createCountState();
	return {
		countState,
		getAlarmTargetCount() {
			return countState.alarmCount();
		},
		resetTargetCounts() {
			countState.reset();
		},
	};
}
