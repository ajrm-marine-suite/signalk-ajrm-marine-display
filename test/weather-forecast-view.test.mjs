import assert from "node:assert/strict";
import test from "node:test";

import {
	forecastColumns,
	forecastRows,
} from "../src/web/assets/scripts/weather-forecast-view.mjs";

test("Display uses the Weather Database's concise hourly table columns", () => {
	assert.deepEqual(
		forecastColumns.map((column) => column[1]),
		[
			"Local Time (UK)",
			"Temp (°C)",
			"Wind (kn)",
			"Gust (kn)",
			"Wind Dir",
			"Wave (m)",
			"Period (s)",
			"Wave Dir",
			"Swell (m)",
			"Swell (s)",
			"Swell Dir",
		],
	);
});

test("weather rows use UK civil time and keep weather and marine fields together", () => {
	const rows = forecastRows({
		hourly: {
			forecast: {
				timezone: "GMT",
				hourly: {
					time: ["2026-08-21T12:00"],
					temperature_2m: [14],
					wind_speed_10m: [12],
					wind_gusts_10m: [20],
					wind_direction_10m: [270],
				},
			},
			marine: {
				hourly: {
					wave_height: [1.2],
					wave_period: [6],
					wave_direction: [90],
					swell_wave_height: [0.8],
					swell_wave_period: [9],
					swell_wave_direction: [180],
				},
			},
		},
	});
	assert.equal(rows.length, 1);
	assert.match(rows[0].localTime, /21 Aug, 13:00/);
	assert.deepEqual(
		{
			temperature: rows[0].temperature,
			wind: rows[0].wind,
			gust: rows[0].gust,
			windDirection: rows[0].windDirection,
			waveHeight: rows[0].waveHeight,
			waveDirection: rows[0].waveDirection,
			swellDirection: rows[0].swellDirection,
		},
		{
			temperature: "14.0",
			wind: "12.0",
			gust: "20.0",
			windDirection: "W (270°)",
			waveHeight: "1.2",
			waveDirection: "E (90°)",
			swellDirection: "S (180°)",
		},
	);
});
