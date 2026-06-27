import * as L from "leaflet";
import {
	boundsIntersect,
	harbourDisplayName,
	harbourLabelPoint,
	harbourLatLngs,
	harbourPolygonBounds,
	harbourPolygons,
} from "./harbour-display-geometry.mjs";

export function createHarbourDisplayController({
	map,
	getRegions,
	initialEnabled = true,
	refreshIntervalMs = 60000,
	leaflet = L,
	now = () => Date.now(),
}) {
	const layer = leaflet.layerGroup();
	let regions = [];
	let lastFetch = null;
	let enabled = initialEnabled;
	let dataRevision = 0;
	let renderedRevision = -1;
	let renderedRegionKey = "";

	function clear() {
		layer.clearLayers();
		if (map.hasLayer(layer)) layer.removeFrom(map);
		renderedRevision = -1;
		renderedRegionKey = "";
	}

	async function loadRegions() {
		const currentTime = now();
		if (lastFetch != null && currentTime - lastFetch <= refreshIntervalMs) {
			return false;
		}
		lastFetch = currentTime;
		regions = await getRegions();
		dataRevision += 1;
		return true;
	}

	async function update({ enabled }) {
		setEnabled(enabled);
		if (!isEnabled()) {
			clear();
			return;
		}
		if (!map.hasLayer(layer)) layer.addTo(map);
		try {
			await loadRegions();
		} catch (error) {
			console.error("Error loading harbour regions", error);
			regions = [];
			dataRevision += 1;
		}
		renderRegions();
	}

	function renderRegions() {
		const viewBounds = mapViewBounds(map);
		const visiblePolygons = visibleHarbourPolygons(regions, viewBounds);
		const regionKey = visiblePolygons.map((entry) => entry.key).join("|");
		if (renderedRevision === dataRevision && renderedRegionKey === regionKey) {
			return;
		}
		layer.clearLayers();
		for (const { polygon, region } of visiblePolygons) {
			const latLngs = harbourLatLngs(polygon);
			if (!latLngs.length) continue;
			leaflet.polygon(latLngs, {
				color: "#22c55e",
				weight: 3,
				opacity: 0.95,
				fill: false,
				dashArray: "6 8",
				interactive: false,
				className: "ajrmMarineHarbourLimit",
			}).addTo(layer);
			const labelPoint = harbourLabelPoint(polygon);
			if (labelPoint) {
				leaflet.tooltip(labelPoint, {
					content: harbourDisplayName(region.name),
					permanent: true,
					direction: "bottom",
					opacity: 0.9,
					offset: [0, 8],
					className: "map-labels harbour-label",
					interactive: false,
				}).addTo(layer);
			}
		}
		renderedRevision = dataRevision;
		renderedRegionKey = regionKey;
	}

	return {
		clear,
		layer,
		update,
		invalidate() {
			lastFetch = null;
		},
		isEnabled,
		setEnabled,
	};

	function isEnabled() {
		return enabled === true;
	}

	function setEnabled(value) {
		enabled = value === true;
	}
}

export function visibleHarbourPolygons(regions, viewBounds) {
	const visible = [];
	regions.forEach((region, regionIndex) => {
		harbourPolygons(region).forEach((polygon, polygonIndex) => {
			if (!boundsIntersect(harbourPolygonBounds(polygon), viewBounds)) return;
			visible.push({
				key: `${region.id || region.name || regionIndex}:${polygonIndex}`,
				polygon,
				region,
			});
		});
	});
	return visible;
}

export function mapViewBounds(map, paddingRatio = 0.25) {
	const bounds = map.getBounds?.();
	if (!bounds) return null;
	const west = finiteBoundValue(bounds.getWest?.(), bounds._southWest?.lng);
	const east = finiteBoundValue(bounds.getEast?.(), bounds._northEast?.lng);
	const south = finiteBoundValue(bounds.getSouth?.(), bounds._southWest?.lat);
	const north = finiteBoundValue(bounds.getNorth?.(), bounds._northEast?.lat);
	if (
		!Number.isFinite(west) ||
		!Number.isFinite(east) ||
		!Number.isFinite(south) ||
		!Number.isFinite(north)
	) {
		return null;
	}
	const lonPad = Math.abs(east - west) * paddingRatio;
	const latPad = Math.abs(north - south) * paddingRatio;
	return {
		west: west - lonPad,
		south: south - latPad,
		east: east + lonPad,
		north: north + latPad,
	};
}

function finiteBoundValue(primary, fallback) {
	const value = Number(primary);
	if (Number.isFinite(value)) return value;
	const fallbackValue = Number(fallback);
	return Number.isFinite(fallbackValue) ? fallbackValue : null;
}
