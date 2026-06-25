function iconHtml(icon) {
	return `<span class="${String(icon).replaceAll('"', "&quot;")}"></span>`;
}

function createFallbackEasyButton(L) {
	return function fallbackEasyButton(icon, onClick, title = "") {
		let buttonElement;
		const EasyButton = L.Control.extend({
			options: {
				position: "topleft",
			},
			onAdd(map) {
				buttonElement = L.DomUtil.create(
					"button",
					"easy-button-button leaflet-bar-part leaflet-interactive",
				);
				buttonElement.type = "button";
				buttonElement.innerHTML = iconHtml(icon);
				buttonElement.title = title;
				L.DomEvent.disableClickPropagation(buttonElement);
				L.DomEvent.on(buttonElement, "click", (event) => {
					L.DomEvent.stop(event);
					onClick?.(control, map);
					map.getContainer?.().focus?.();
				});
				control.button = buttonElement;
				return buttonElement;
			},
		});
		const control = new EasyButton();
		control.button = buttonElement;
		return control;
	};
}

export function createEasyButtonFactory(L, globalLeaflet = globalThis.L) {
	if (typeof L?.easyButton === "function") {
		return (...args) => L.easyButton(...args);
	}
	if (typeof globalLeaflet?.easyButton === "function") {
		return (...args) => globalLeaflet.easyButton(...args);
	}
	return createFallbackEasyButton(L);
}
