import {
	ajrmMarineAuthHeaders,
	assertAisPlusResponseAllowed,
} from "./ajrm-marine-api-access.mjs";

export async function getJsonResponse(url, options = {}) {
	let response;
	let jsonResponse;
	try {
		response = await fetch(url, {
			credentials: "include",
			cache: options.cache || "default",
			headers: ajrmMarineAuthHeaders(),
		});
		if (!response.ok) {
			await assertAisPlusResponseAllowed(response, "AJRM Marine");
			if (response.status === 404 && options.ignore404) {
				options.on404?.();
			} else {
				console.error(`Response status: ${response.status} from ${url}`);
				if (options.throwErrors) {
					throw new Error(`Response status: ${response.status} from ${url}`);
				}
			}
		} else {
			const textResponse = await response.text();
			if (textResponse) {
				jsonResponse = JSON.parse(textResponse);
			} else if (!options.ignoreEmptyResponse) {
				throw new Error(`Error: Got empty json response from ${url}`);
			}
		}
	} catch (error) {
		console.error(
			`Error in getJsonResponse: url=${url}, options=${JSON.stringify(
				options,
			)}, status=${response?.status || "none"}`,
			error,
		);
		if (options.throwErrors) {
			options.onFatalError?.(
				`Encountered an error retrieving data from the SignalK server. Verify that you are connected to the SignalK server, that the SignalK server is running, and that AJRM Marine is enabled.`,
			);
			throw new Error(
				`Error in getJsonResponse: url=${url}, options=${JSON.stringify(
					options,
				)}, status=${response?.status || "none"}, error=${error.message}`,
			);
		}
	}
	return jsonResponse;
}
