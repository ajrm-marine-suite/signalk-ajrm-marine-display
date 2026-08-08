/**
 * Implements the page controllers responsibilities of the AJRM Marine Display browser application.
 */

import { startAlertPanel } from "./alert-panel-controller.mjs";
import { startAnnouncementLog } from "./announcement-log-controller.mjs";

export function startPageControllers({
	startAlertPanelFn = startAlertPanel,
	startAnnouncementLogFn = startAnnouncementLog,
} = {}) {
	return {
		alertPanel: startAlertPanelFn(),
		announcementLog: startAnnouncementLogFn(),
	};
}
