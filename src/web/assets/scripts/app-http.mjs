import { getJsonResponse } from "./server-api.mjs";

export function createAppHttp({ onFatalError }) {
	return {
		getHttpResponse: (url, options) =>
			getJsonResponse(url, { ...options, onFatalError }),
	};
}
