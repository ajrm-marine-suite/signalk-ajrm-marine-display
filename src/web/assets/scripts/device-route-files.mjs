/**
 * Reads user-selected GPX files in the browser and builds lightweight route
 * entries for local selection and current-map-area filtering.
 */

export async function indexDeviceRouteFiles(
	fileList,
	{ DOMParserClass = globalThis.DOMParser } = {},
) {
	const files = Array.from(fileList || []).filter((file) =>
		String(file?.name || "").toLowerCase().endsWith(".gpx"),
	);
	const routes = [];
	const errors = [];
	for (const file of files) {
		try {
			const gpx = await file.text();
			const indexed = parseDeviceGpxRoutes(gpx, {
				fileName: file.name,
				DOMParserClass,
			});
			for (const route of indexed) {
				routes.push({
					...route,
					id: deviceRouteId(file, route.routeIndex),
					fileName: file.name,
					devicePath: file.webkitRelativePath || file.name,
					gpx,
				});
			}
		} catch (error) {
			errors.push({ fileName: file.name, message: error.message });
		}
	}
	return { files: files.length, routes, errors };
}

export function parseDeviceGpxRoutes(
	xml,
	{ fileName = "route.gpx", DOMParserClass = globalThis.DOMParser } = {},
) {
	if (typeof DOMParserClass !== "function") throw new Error("This browser cannot read GPX XML");
	const document = new DOMParserClass().parseFromString(String(xml || ""), "application/xml");
	if (
		document.getElementsByTagName("parsererror").length ||
		document.getElementsByTagNameNS?.("*", "parsererror")?.length
	) throw new Error("Invalid GPX XML");
	const root = document.documentElement;
	if (root?.localName !== "gpx" || root.getAttribute("version") !== "1.1") {
		throw new Error("A GPX 1.1 file is required");
	}
	const metadata = directChild(root, "metadata");
	const metadataName = directChildText(metadata, "name");
	const routeElements = descendants(root, "rte");
	if (!routeElements.length) throw new Error("The GPX file contains no routes");
	return routeElements.map((route, routeIndex) => {
		const coordinates = descendants(route, "rtept").map((point, pointIndex) => {
			const longitude = finiteCoordinate(point.getAttribute("lon"), -180, 180);
			const latitude = finiteCoordinate(point.getAttribute("lat"), -90, 90);
			if (longitude === null || latitude === null) {
				throw new Error(`Route ${routeIndex + 1}, point ${pointIndex + 1} has invalid coordinates`);
			}
			return [longitude, latitude];
		});
		if (coordinates.length < 2) {
			throw new Error(`Route ${routeIndex + 1} contains fewer than two route points`);
		}
		return {
			name: directChildText(route, "name") ||
				(routeIndex === 0 ? metadataName : "") ||
				fileStem(fileName) ||
				`Route ${routeIndex + 1}`,
			routeIndex,
			points: coordinates.length,
			spatial: { coordinates },
		};
	});
}

function deviceRouteId(file, routeIndex) {
	return [file.webkitRelativePath || file.name, file.size || 0, file.lastModified || 0, routeIndex].join(":");
}

function descendants(element, localName) {
	if (!element) return [];
	return Array.from(element.getElementsByTagNameNS?.("*", localName) || []);
}

function directChild(element, localName) {
	return Array.from(element?.children || []).find((child) => child.localName === localName) || null;
}

function directChildText(element, localName) {
	return String(directChild(element, localName)?.textContent || "").trim();
}

function finiteCoordinate(value, minimum, maximum) {
	const number = Number(value);
	return Number.isFinite(number) && number >= minimum && number <= maximum ? number : null;
}

function fileStem(value) {
	return String(value || "").replace(/\.gpx$/i, "").trim();
}
