import { createEasyButtonFactory } from "./easy-button-factory.mjs";

export function configuredMapOptions(defaultMapZoom) {
	return {
		center: [55.8, -5.2],
		zoom: defaultMapZoom,
		minZoom: 3,
		maxZoom: 22,
	};
}

export function chartScaleControlOptions() {
	return {
		position: "bottomleft",
		maxWidth: 160,
		metric: true,
		imperial: false,
	};
}

export function addChartScaleControl({ L, map }) {
	if (!L?.control?.scale || !map) return null;
	const control = L.control.scale(chartScaleControlOptions());
	control.addTo(map);
	return control;
}

export function createConfiguredMapBasics({
	L,
	defaultMapZoom,
	factories = {},
}) {
	const createEasyButton =
		factories.createEasyButtonFactory || createEasyButtonFactory;
	const map = L.map("map", configuredMapOptions(defaultMapZoom));
	const chartScaleControl = addChartScaleControl({ L, map });
	const easyButton = createEasyButton(L);

	return { map, easyButton, chartScaleControl };
}
