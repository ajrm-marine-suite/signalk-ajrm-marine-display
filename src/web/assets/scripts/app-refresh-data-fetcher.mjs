import { atonsApiPath, vesselsApiPath } from "./app-refresh-routes.mjs";

export function createRefreshDataFetcher({ getHttpResponse }) {
	let autoFetchAtons = true;

	async function fetchRefreshVessels() {
		const vessels = await getHttpResponse(vesselsApiPath(), {
			throwErrors: true,
		});

		const atons = autoFetchAtons
			? await getHttpResponse(atonsApiPath(), {
					ignore404: true,
					on404: () => {
						autoFetchAtons = false;
					},
				})
			: {};

		return Object.assign(vessels, atons);
	}

	return { fetchRefreshVessels };
}
