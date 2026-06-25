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
