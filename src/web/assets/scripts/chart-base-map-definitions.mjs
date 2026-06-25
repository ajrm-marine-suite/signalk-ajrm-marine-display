export const BASE_MAP_LAYER_SPECS = [
	{
		name: "Empty",
		url: "",
		options: {},
	},
	{
		name: "OpenStreetMap",
		url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
		options: {
			maxZoom: 19,
			attribution: "© OpenStreetMap",
		},
	},
	{
		name: "OpenTopoMap",
		url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
		options: {
			maxZoom: 19,
			attribution:
				"Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)",
		},
	},
	{
		name: "Satellite",
		url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
		options: {
			maxNativeZoom: 17,
			maxZoom: 20,
			attribution: "© Esri © OpenStreetMap Contributors",
		},
	},
];

export const NATURAL_EARTH_BASE_MAP_NAME = "NaturalEarth (offline)";
export const NATURAL_EARTH_MAX_DATA_ZOOM = 5;
