import assert from "node:assert/strict";
import test from "node:test";
import {
	indexDeviceRouteFiles,
	parseDeviceGpxRoutes,
} from "../src/web/assets/scripts/device-route-files.mjs";

class FakeElement {
	constructor(localName, { attributes = {}, text = "", children = [] } = {}) {
		this.localName = localName;
		this.attributes = attributes;
		this.textContent = text;
		this.children = children;
	}

	getAttribute(name) {
		return this.attributes[name] ?? null;
	}

	getElementsByTagNameNS(_namespace, localName) {
		return this.children.flatMap((child) => [
			...(child.localName === localName ? [child] : []),
			...child.getElementsByTagNameNS("*", localName),
		]);
	}
}

function documentForRoutes() {
	const point = (longitude, latitude) => new FakeElement("rtept", {
		attributes: { lon: longitude, lat: latitude },
	});
	const route = (name, points) => new FakeElement("rte", {
		children: [new FakeElement("name", { text: name }), ...points],
	});
	const root = new FakeElement("gpx", {
		attributes: { version: "1.1" },
		children: [
			new FakeElement("metadata", { children: [new FakeElement("name", { text: "Metadata route" })] }),
			route("West coast passage", [point("-6", "56"), point("-5", "57")]),
			route("Return passage", [point("-5", "57"), point("-6", "56")]),
		],
	});
	return {
		documentElement: root,
		getElementsByTagName: () => [],
	};
}

class FakeDomParser {
	parseFromString() {
		return documentForRoutes();
	}
}

test("device GPX indexing exposes every route and its filter geometry", () => {
	const routes = parseDeviceGpxRoutes("fixture", {
		fileName: "passages.gpx",
		DOMParserClass: FakeDomParser,
	});
	assert.deepEqual(routes.map((route) => route.name), ["West coast passage", "Return passage"]);
	assert.deepEqual(routes[0].spatial.coordinates, [[-6, 56], [-5, 57]]);
	assert.equal(routes[1].routeIndex, 1);
});

test("device file indexing skips non-GPX files and keeps file identity", async () => {
	const result = await indexDeviceRouteFiles([
		{ name: "passages.gpx", webkitRelativePath: "Scotland/passages.gpx", size: 123, lastModified: 456, text: async () => "fixture" },
		{ name: "notes.txt", size: 2, lastModified: 3, text: async () => "no" },
	], { DOMParserClass: FakeDomParser });
	assert.equal(result.files, 1);
	assert.equal(result.routes.length, 2);
	assert.equal(result.routes[0].fileName, "passages.gpx");
	assert.equal(result.routes[0].devicePath, "Scotland/passages.gpx");
	assert.match(result.routes[0].id, /^Scotland\/passages\.gpx:123:456:0$/);
});
