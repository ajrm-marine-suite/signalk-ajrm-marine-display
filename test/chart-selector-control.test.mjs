import assert from "node:assert/strict";
import test from "node:test";
import {
	applyChartSelectorInputAction,
	attachChartSelectorContainerBehaviour,
	baseMapInputAction,
	chartSelectorInputAction,
	CHART_BASEMAP_INPUT_NAME,
	CHART_SELECTOR_BUTTON_CLASS,
	CHART_SELECTOR_BUTTON_LABEL,
	CHART_SELECTOR_CONTAINER_CLASS,
	CHART_SELECTOR_PANEL_CLASS,
	CHART_OVERLAY_INPUT_NAME,
	chartSelectorEventHandlers,
	chartSelectorControlApi,
	chartSelectorControlApiConfig,
	chartSelectorControlDefinition,
	chartSelectorControlDefinitionConfig,
	chartSelectorInputQuery,
	chartSelectorPanelForControl,
	configureChartSelectorButton,
	configureChartSelectorPanel,
	createChartSelectorButton,
	createChartSelectorContainer,
	createChartSelectorControl,
	createLeafletChartSelectorControl,
	createChartSelectorPanel,
	escapeAttribute,
	handlePanelChange,
	hidePanel,
	isChartSelectorInput,
	overlayInputAction,
	renderBaseMapOptions,
	renderOptions,
	renderOverlayOptions,
	renderOption,
	renderPanel,
	setPanelExpanded,
	togglePanel,
	updateBaseLayerInputs,
	updateCheckedInputs,
	updateOverlayInputs,
} from "../src/web/assets/scripts/chart-selector-control.mjs";

function fakeLeaflet() {
	const listeners = new WeakMap();
	const created = [];
	class FakeElement {
		constructor(tag, className = "") {
			this.tag = tag;
			this.className = className;
			this.children = [];
			this.attributes = {};
			this.hidden = false;
			this.type = "";
			this.title = "";
			this._innerHTML = "";
			created.push(this);
		}

		appendChild(child) {
			this.children.push(child);
		}

		setAttribute(name, value) {
			this.attributes[name] = value;
		}

		getAttribute(name) {
			return this.attributes[name];
		}

		set innerHTML(value) {
			this._innerHTML = value;
			this.inputs = [...value.matchAll(/<input[^>]+>/g)].map((match) => {
				const tag = match[0];
				return {
					checked: false,
					name: tag.match(/name="([^"]+)"/)?.[1] || "",
					type: tag.match(/type="([^"]+)"/)?.[1] || "",
					value: tag.match(/value="([^"]+)"/)?.[1] || "",
				};
			});
		}

		get innerHTML() {
			return this._innerHTML;
		}

		querySelectorAll(selector) {
			if (selector === 'input[name="ajrm-marine-basemap"]') {
				return (this.inputs || []).filter(
					(input) => input.name === "ajrm-marine-basemap",
				);
			}
			if (selector === 'input[name="ajrm-marine-overlay"]') {
				return (this.inputs || []).filter(
					(input) => input.name === "ajrm-marine-overlay",
				);
			}
			return [];
		}
	}

	const L = {
		Control: {
			extend(definition) {
				return class {
					constructor() {
						this.options = definition.options;
					}

					addTo(map) {
						this._container = definition.onAdd.call(this, map);
						return this;
					}

					getContainer() {
						return this._container;
					}
				};
			},
		},
		DomUtil: {
			create(tag, className, parent) {
				const element = new FakeElement(tag, className);
				parent?.appendChild?.(element);
				return element;
			},
		},
		DomEvent: {
			disableClickPropagation(element) {
				element.disableClickPropagation = true;
			},
			disableScrollPropagation(element) {
				element.disableScrollPropagation = true;
			},
			on(target, event, handler) {
				if (!listeners.has(target)) listeners.set(target, {});
				listeners.get(target)[event] = handler;
			},
			stop(event) {
				event.stopped = true;
			},
		},
	};

	return { created, L, listeners };
}

test("escapeAttribute escapes HTML and backticks for selector values", () => {
	assert.equal(escapeAttribute("A`B", (value) => value), "A&#96;B");
	assert.equal(
		escapeAttribute("<Chart>", (value) => value.replaceAll("<", "&lt;").replaceAll(">", "&gt;")),
		"&lt;Chart&gt;",
	);
});

test("togglePanel flips visibility and aria state", () => {
	let stopped = false;
	const button = {
		values: {},
		setAttribute(name, value) {
			this.values[name] = value;
		},
	};
	const panel = { hidden: true };

	togglePanel({
		L: { DomEvent: { stop: () => { stopped = true; } } },
		button,
		panel,
		event: { type: "click" },
	});

	assert.equal(stopped, true);
	assert.equal(panel.hidden, false);
	assert.equal(button.values["aria-expanded"], "true");
});

test("hidePanel closes the chart selector and updates aria state", () => {
	const button = {
		values: {},
		setAttribute(name, value) {
			this.values[name] = value;
		},
	};
	const panel = { hidden: false };

	hidePanel({ button, panel });

	assert.equal(panel.hidden, true);
	assert.equal(button.values["aria-expanded"], "false");
});

test("setPanelExpanded keeps panel hidden and aria-expanded in sync", () => {
	const button = {
		values: {},
		setAttribute(name, value) {
			this.values[name] = value;
		},
	};
	const panel = { hidden: true };

	setPanelExpanded({ button, panel, expanded: true });
	assert.equal(panel.hidden, false);
	assert.equal(button.values["aria-expanded"], "true");

	setPanelExpanded({ button, panel, expanded: false });
	assert.equal(panel.hidden, true);
	assert.equal(button.values["aria-expanded"], "false");
});

test("handlePanelChange routes basemap and overlay inputs", () => {
	const previousInput = globalThis.HTMLInputElement;
	class FakeInput {}
	globalThis.HTMLInputElement = FakeInput;
	const calls = [];
	try {
		const baseInput = Object.assign(new FakeInput(), {
			name: CHART_BASEMAP_INPUT_NAME,
			value: "NaturalEarth",
		});
		handlePanelChange({
			event: { target: baseInput },
			onSelectBaseLayer: (value) => calls.push(`base:${value}`),
			onSetOverlayLayer: (value, checked) =>
				calls.push(`overlay:${value}:${checked}`),
		});
		const overlayInput = Object.assign(new FakeInput(), {
			checked: true,
			name: CHART_OVERLAY_INPUT_NAME,
			value: "OpenSeaMap",
		});
		handlePanelChange({
			event: { target: overlayInput },
			onSelectBaseLayer: (value) => calls.push(`base:${value}`),
			onSetOverlayLayer: (value, checked) =>
				calls.push(`overlay:${value}:${checked}`),
		});
		handlePanelChange({
			event: { target: { name: "ajrm-marine-basemap", value: "Ignored" } },
			onSelectBaseLayer: (value) => calls.push(`base:${value}`),
			onSetOverlayLayer: (value, checked) =>
				calls.push(`overlay:${value}:${checked}`),
		});
	} finally {
		globalThis.HTMLInputElement = previousInput;
	}

	assert.deepEqual(calls, [
		"base:NaturalEarth",
		"overlay:OpenSeaMap:true",
	]);
});

test("chart selector input actions classify basemap and overlay changes", () => {
	assert.deepEqual(
		baseMapInputAction({ value: "NaturalEarth" }),
		{ type: "base", value: "NaturalEarth" },
	);
	assert.deepEqual(
		overlayInputAction({ checked: true, value: "OpenSeaMap" }),
		{ type: "overlay", value: "OpenSeaMap", checked: true },
	);
	assert.deepEqual(
		chartSelectorInputAction({
			name: CHART_BASEMAP_INPUT_NAME,
			value: "NaturalEarth",
		}),
		{ type: "base", value: "NaturalEarth" },
	);
	assert.deepEqual(
		chartSelectorInputAction({
			checked: true,
			name: CHART_OVERLAY_INPUT_NAME,
			value: "OpenSeaMap",
		}),
		{ type: "overlay", value: "OpenSeaMap", checked: true },
	);
	assert.equal(chartSelectorInputAction({ name: "other" }), null);
});

test("isChartSelectorInput recognises DOM input elements", () => {
	const previousInput = globalThis.HTMLInputElement;
	class FakeInput {}
	globalThis.HTMLInputElement = FakeInput;
	try {
		assert.equal(isChartSelectorInput(new FakeInput()), true);
		assert.equal(isChartSelectorInput({}), false);
	} finally {
		globalThis.HTMLInputElement = previousInput;
	}
});

test("applyChartSelectorInputAction routes classified input actions", () => {
	const calls = [];
	const handlers = {
		onSelectBaseLayer: (value) => calls.push(`base:${value}`),
		onSetOverlayLayer: (value, checked) =>
			calls.push(`overlay:${value}:${checked}`),
	};

	assert.equal(
		applyChartSelectorInputAction({
			action: { type: "base", value: "NaturalEarth" },
			...handlers,
		}),
		true,
	);
	assert.equal(
		applyChartSelectorInputAction({
			action: { type: "overlay", value: "OpenSeaMap", checked: false },
			...handlers,
		}),
		true,
	);
	assert.equal(
		applyChartSelectorInputAction({
			action: null,
			...handlers,
		}),
		false,
	);
	assert.deepEqual(calls, ["base:NaturalEarth", "overlay:OpenSeaMap:false"]);
});

test("updateBaseLayerInputs checks the selected basemap radio", () => {
	const inputs = [
		{ value: "Empty", checked: true },
		{ value: "NaturalEarth", checked: false },
	];
	const panel = {
		querySelectorAll(selector) {
			assert.equal(selector, chartSelectorInputQuery(CHART_BASEMAP_INPUT_NAME));
			return inputs;
		},
	};

	updateBaseLayerInputs(panel, () => "NaturalEarth");

	assert.deepEqual(
		inputs.map((input) => input.checked),
		[false, true],
	);
});

test("updateOverlayInputs checks enabled overlay checkboxes", () => {
	const inputs = [
		{ value: "OpenSeaMap", checked: false },
		{ value: "Auto Charts", checked: false },
	];
	const panel = {
		querySelectorAll(selector) {
			assert.equal(selector, chartSelectorInputQuery(CHART_OVERLAY_INPUT_NAME));
			return inputs;
		},
	};

	updateOverlayInputs(panel, (value) => value === "Auto Charts");

	assert.deepEqual(
		inputs.map((input) => input.checked),
		[false, true],
	);
});

test("updateCheckedInputs applies a shared checked-state predicate", () => {
	const inputs = [
		{ value: "A", checked: false },
		{ value: "B", checked: false },
	];
	const panel = {
		querySelectorAll(selector) {
			assert.equal(selector, chartSelectorInputQuery("test-input"));
			return inputs;
		},
	};

	updateCheckedInputs({
		panel,
		inputName: "test-input",
		isChecked: (value) => value === "B",
	});

	assert.deepEqual(
		inputs.map((input) => input.checked),
		[false, true],
	);
});

test("renderPanel includes base maps and overlays with escaped labels", () => {
	assert.match(
		renderOption(CHART_BASEMAP_INPUT_NAME, "radio", "NaturalEarth", (value) => value),
		/name="ajrm-marine-basemap"/,
	);
	assert.match(
		renderOptions({
			names: ["OpenSeaMap"],
			inputName: CHART_OVERLAY_INPUT_NAME,
			inputType: "checkbox",
			escapeHtml: (value) => value,
		}),
		/type="checkbox" name="ajrm-marine-overlay"/,
	);
	assert.match(
		renderBaseMapOptions({
			baseMaps: { Empty: {} },
			escapeHtml: (value) => value,
		}),
		/Empty/,
	);
	assert.match(
		renderOverlayOptions({
			overlayMaps: { OpenSeaMap: {} },
			escapeHtml: (value) => value,
		}),
		/OpenSeaMap/,
	);
	const html = renderPanel({
		baseMaps: { "NaturalEarth (offline)": {} },
		overlayMaps: { OpenSeaMap: {}, "Auto Charts": {} },
		escapeHtml: (value) => value.replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
	});

	assert.match(html, /Basemap/);
	assert.match(html, /NaturalEarth \(offline\)/);
	assert.match(html, /OpenSeaMap/);
	assert.match(html, /Auto Charts/);
	assert.match(html, /name="ajrm-marine-basemap"/);
	assert.match(html, /name="ajrm-marine-overlay"/);
});

test("configureChartSelectorButton sets accessible button attributes", () => {
	const button = {
		attributes: {},
		setAttribute(name, value) {
			this.attributes[name] = value;
		},
	};

	configureChartSelectorButton(button);

	assert.equal(button.type, "button");
	assert.equal(button.title, CHART_SELECTOR_BUTTON_LABEL);
	assert.equal(button.attributes["aria-label"], CHART_SELECTOR_BUTTON_LABEL);
	assert.equal(button.attributes["aria-expanded"], "false");
});

test("configureChartSelectorPanel renders the hidden selector panel", () => {
	const panel = {};

	configureChartSelectorPanel({
		panel,
		baseMaps: { Empty: {} },
		overlayMaps: { OpenSeaMap: {} },
		escapeHtml: (value) => value,
	});

	assert.equal(panel.hidden, true);
	assert.match(panel.innerHTML, /Basemap/);
	assert.match(panel.innerHTML, /OpenSeaMap/);
});

test("chart selector DOM part helpers construct and attach the panel", () => {
	const { L } = fakeLeaflet();
	const container = createChartSelectorContainer(L);
	const button = createChartSelectorButton({ L, container });
	const panel = createChartSelectorPanel({
		L,
		container,
		baseMaps: { Empty: {} },
		overlayMaps: { OpenSeaMap: {} },
		escapeHtml: (value) => value,
	});
	const returned = attachChartSelectorContainerBehaviour({ L, container, panel });

	assert.equal(returned, container);
	assert.equal(container.className, CHART_SELECTOR_CONTAINER_CLASS);
	assert.equal(button.title, CHART_SELECTOR_BUTTON_LABEL);
	assert.equal(panel.hidden, true);
	assert.equal(container._ajrmMarineChartPanel, panel);
	assert.equal(container.disableClickPropagation, true);
	assert.equal(container.disableScrollPropagation, true);
	assert.deepEqual(container.children, [button, panel]);
});

test("createChartSelectorControl wires Leaflet DOM events and input updates", () => {
	const previousInput = globalThis.HTMLInputElement;
	class FakeInput {}
	globalThis.HTMLInputElement = FakeInput;
	try {
		const { created, L, listeners } = fakeLeaflet();
		const map = {};
		const calls = [];
		const selector = createChartSelectorControl({
			L,
			map,
			baseMaps: { Empty: {}, "NaturalEarth (offline)": {} },
			overlayMaps: { OpenSeaMap: {}, "Auto Charts": {} },
			getBaseLayerName: () => "NaturalEarth (offline)",
			isOverlayEnabled: (name) => name === "OpenSeaMap",
			onSelectBaseLayer: (name) => calls.push(["base", name]),
			onSetOverlayLayer: (name, enabled) =>
				calls.push(["overlay", name, enabled]),
			escapeHtml: (value) => value,
		});

		selector.control.addTo(map);
		const container = selector.control.getContainer();
		const button = created.find((element) =>
			element.className.includes(CHART_SELECTOR_BUTTON_CLASS.split(" ")[0]),
		);
		const panel = container._ajrmMarineChartPanel;

		assert.equal(container.className, CHART_SELECTOR_CONTAINER_CLASS);
		assert.equal(container.disableClickPropagation, true);
		assert.equal(container.disableScrollPropagation, true);
		assert.equal(button.title, CHART_SELECTOR_BUTTON_LABEL);
		assert.equal(panel.className, CHART_SELECTOR_PANEL_CLASS);
		assert.equal(panel.hidden, true);
		assert.match(panel.innerHTML, /NaturalEarth \(offline\)/);

		const clickEvent = {};
		listeners.get(button).click(clickEvent);
		assert.equal(clickEvent.stopped, true);
		assert.equal(panel.hidden, false);
		assert.equal(button.getAttribute("aria-expanded"), "true");

		listeners.get(map).click();
		assert.equal(panel.hidden, true);
		assert.equal(button.getAttribute("aria-expanded"), "false");

		Object.setPrototypeOf(panel.inputs[1], FakeInput.prototype);
		panel.inputs[1].name = CHART_BASEMAP_INPUT_NAME;
		panel.inputs[1].value = "NaturalEarth (offline)";
		listeners.get(panel).change({ target: panel.inputs[1] });

		Object.setPrototypeOf(panel.inputs[2], FakeInput.prototype);
		panel.inputs[2].name = CHART_OVERLAY_INPUT_NAME;
		panel.inputs[2].value = "OpenSeaMap";
		panel.inputs[2].checked = false;
		listeners.get(panel).change({ target: panel.inputs[2] });

		assert.deepEqual(calls, [
			["base", "NaturalEarth (offline)"],
			["overlay", "OpenSeaMap", false],
		]);

		selector.update();
		const baseInputs = panel.querySelectorAll('input[name="ajrm-marine-basemap"]');
		const overlayInputs = panel.querySelectorAll('input[name="ajrm-marine-overlay"]');
		assert.deepEqual(
			baseInputs.map((input) => input.checked),
			[false, true],
		);
		assert.deepEqual(
			overlayInputs.map((input) => input.checked),
			[true, false],
		);
	} finally {
		globalThis.HTMLInputElement = previousInput;
	}
});

test("chartSelectorControlDefinition describes the Leaflet selector control", () => {
	const { created, L, listeners } = fakeLeaflet();
	const map = {};
	const calls = [];
	const definition = chartSelectorControlDefinition({
		L,
		map,
		baseMaps: { Empty: {} },
		overlayMaps: { OpenSeaMap: {} },
		onSelectBaseLayer: (name) => calls.push(["base", name]),
		onSetOverlayLayer: (name, enabled) =>
			calls.push(["overlay", name, enabled]),
		escapeHtml: (value) => value,
	});

	assert.deepEqual(definition.options, { position: "topleft" });
	const container = definition.onAdd();
	const button = created.find((element) =>
		element.className.includes(CHART_SELECTOR_BUTTON_CLASS.split(" ")[0]),
	);

	assert.equal(container.className, CHART_SELECTOR_CONTAINER_CLASS);
	assert.ok(listeners.get(button).click);
	assert.ok(listeners.get(container._ajrmMarineChartPanel).change);
	assert.ok(listeners.get(map).click);
});

test("chart selector control config helpers keep Leaflet construction explicit", () => {
	const { L } = fakeLeaflet();
	const map = {};
	const definitionConfig = chartSelectorControlDefinitionConfig({
		L,
		map,
		baseMaps: { Empty: {} },
		overlayMaps: { OpenSeaMap: {} },
		onSelectBaseLayer: () => {},
		onSetOverlayLayer: () => {},
		escapeHtml: (value) => value,
	});
	const control = createLeafletChartSelectorControl(definitionConfig);
	const apiConfig = chartSelectorControlApiConfig({
		control,
		getBaseLayerName: () => "Empty",
		isOverlayEnabled: () => false,
	});

	assert.equal(definitionConfig.map, map);
	assert.equal(definitionConfig.baseMaps.Empty !== undefined, true);
	assert.deepEqual(control.options, { position: "topleft" });
	assert.equal(apiConfig.control, control);
	assert.equal(apiConfig.getBaseLayerName(), "Empty");
	assert.equal(apiConfig.isOverlayEnabled("OpenSeaMap"), false);
});

test("chartSelectorControlApi exposes the control and update hook", () => {
	let updated = false;
	const panel = {
		querySelectorAll(selector) {
			if (selector === 'input[name="ajrm-marine-basemap"]') {
				return [{ value: "Empty", checked: false }];
			}
			if (selector === 'input[name="ajrm-marine-overlay"]') {
				return [{ value: "OpenSeaMap", checked: false }];
			}
			return [];
		},
	};
	const control = {
		getContainer() {
			return { _ajrmMarineChartPanel: panel };
		},
	};
	const api = chartSelectorControlApi({
		control,
		getBaseLayerName: () => "Empty",
		isOverlayEnabled: () => {
			updated = true;
			return true;
		},
	});

	assert.equal(api.control, control);
	api.update();
	assert.equal(updated, true);
});

test("chartSelectorPanelForControl returns the stored panel or null", () => {
	const panel = { id: "panel" };
	assert.equal(
		chartSelectorPanelForControl({
			getContainer() {
				return { _ajrmMarineChartPanel: panel };
			},
		}),
		panel,
	);
	assert.equal(
		chartSelectorPanelForControl({
			getContainer() {
				return {};
			},
		}),
		null,
	);
});

test("chartSelectorEventHandlers exposes button, panel and map handlers", () => {
	const previousInput = globalThis.HTMLInputElement;
	class FakeInput {}
	globalThis.HTMLInputElement = FakeInput;
	const calls = [];
	const button = {
		attributes: {},
		setAttribute(name, value) {
			this.attributes[name] = value;
		},
	};
	const panel = { hidden: true };
	try {
		const handlers = chartSelectorEventHandlers({
			L: { DomEvent: { stop: (event) => { event.stopped = true; } } },
			button,
			panel,
			onSelectBaseLayer: (value) => calls.push(["base", value]),
			onSetOverlayLayer: (value, checked) =>
				calls.push(["overlay", value, checked]),
		});
		const clickEvent = {};
		handlers.buttonClick(clickEvent);
		assert.equal(clickEvent.stopped, true);
		assert.equal(panel.hidden, false);

		const input = Object.assign(new FakeInput(), {
			name: CHART_BASEMAP_INPUT_NAME,
			value: "NaturalEarth",
		});
		handlers.panelChange({ target: input });
		handlers.mapClick();

		assert.deepEqual(calls, [["base", "NaturalEarth"]]);
		assert.equal(panel.hidden, true);
	} finally {
		globalThis.HTMLInputElement = previousInput;
	}
});
