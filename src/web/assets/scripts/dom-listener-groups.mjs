export function addInputListeners(elements, handler) {
	addEventListeners(elements, "input", handler);
}

export function addChangeListeners(elements, handler) {
	addEventListeners(elements, "change", handler);
}

export function addEventListeners(elements, eventName, handler) {
	for (const element of elements) {
		element.addEventListener(eventName, handler);
	}
}
