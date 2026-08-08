/**
 * Implements the app HTTP responsibilities of the AJRM Marine Display browser application.
 */

import { getJsonResponse } from "./server-api.mjs";

export function createAppHttp({ onFatalError }) {
	return {
		getHttpResponse: (url, options) =>
			getJsonResponse(url, { ...options, onFatalError }),
	};
}
