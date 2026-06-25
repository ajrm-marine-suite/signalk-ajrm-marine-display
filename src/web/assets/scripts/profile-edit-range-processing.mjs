import { applyRangeControlDisplay } from "./profile-edit-view-state.mjs";

export function processProfileRangeControl({
	event,
	profiles,
	selectedRangeCriteria,
	stateForRange,
	documentObject = globalThis.document,
}) {
	const dataset = event.target.dataset;
	const criteria = selectedRangeCriteria(profiles, dataset);
	const state = stateForRange({
		tick: event.target.value,
		dataset,
		criteria,
	});
	applyRangeControlDisplay(documentObject, state);
	return state;
}
