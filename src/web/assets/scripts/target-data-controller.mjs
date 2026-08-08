/**
 * Coordinates target data in the AJRM Marine Display browser application.
 */

export { createServerAlertEventsController } from "./server-alert-events-controller.mjs";
export {
	applyServerAlertEventToTarget,
	resetTargetAlertDisplayState,
} from "./target-alert-event-projection.mjs";
export { ingestRawVesselData } from "./target-snapshot-ingest.mjs";
