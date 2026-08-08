/**
 * Selects auto chart in the AJRM Marine Display browser application.
 */

import { normalizeChartResources } from "@ajrm-marine/map-core";

export function createAutoChartList(charts) {
	return normalizeChartResources(charts);
}
