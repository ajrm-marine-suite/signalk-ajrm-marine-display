/**
 * Provides a visible, browser-independent drag handle for bounded desktop
 * dialog resizing. Pointer Events avoid the native CSS handle that Bootstrap
 * obscures in some Chromium and Firefox builds.
 */

const EDGE_GAP = 8;
export const DIALOG_SIZE_STORAGE_KEY = "ajrmMarineDisplay.tideDialogSize.v1";

export function boundedDialogSize({ width, height, maxWidth, maxHeight, minWidth = 384, minHeight = 320 }) {
	return {
		width: Math.max(Math.min(minWidth, maxWidth), Math.min(width, maxWidth)),
		height: Math.max(Math.min(minHeight, maxHeight), Math.min(height, maxHeight)),
	};
}

export function readSavedDialogSize(storage, key = DIALOG_SIZE_STORAGE_KEY) {
	try {
		const value = JSON.parse(storage?.getItem?.(key));
		return Number.isFinite(value?.width) && Number.isFinite(value?.height) && value.width > 0 && value.height > 0
			? { width: value.width, height: value.height }
			: null;
	} catch {
		return null;
	}
}

export function createDialogResizeController({
	dialog,
	handle,
	windowObject = globalThis.window,
	storage = globalThis.localStorage,
	storageKey = DIALOG_SIZE_STORAGE_KEY,
}) {
	let drag = null;
	const saved = readSavedDialogSize(storage, storageKey);
	if (saved) {
		const size = boundedDialogSize({
			...saved,
			maxWidth: Math.max(1, windowObject.innerWidth - EDGE_GAP * 2),
			maxHeight: Math.max(1, windowObject.innerHeight - EDGE_GAP * 2),
		});
		dialog.style.width = `${Math.round(size.width)}px`;
		dialog.style.height = `${Math.round(size.height)}px`;
	}

	function stop(event) {
		if (!drag || (event?.pointerId != null && event.pointerId !== drag.pointerId)) return;
		handle.releasePointerCapture?.(drag.pointerId);
		const rect = dialog.getBoundingClientRect();
		storage?.setItem?.(storageKey, JSON.stringify({
			width: Math.round(rect.width),
			height: Math.round(rect.height),
		}));
		drag = null;
	}

	function move(event) {
		if (!drag || event.pointerId !== drag.pointerId) return;
		const size = boundedDialogSize({
			width: drag.width + event.clientX - drag.pointerX,
			height: drag.height + event.clientY - drag.pointerY,
			maxWidth: Math.max(1, windowObject.innerWidth - drag.left - EDGE_GAP),
			maxHeight: Math.max(1, windowObject.innerHeight - drag.top - EDGE_GAP),
		});
		dialog.style.width = `${Math.round(size.width)}px`;
		dialog.style.height = `${Math.round(size.height)}px`;
	}

	function start(event) {
		if (event.button !== 0) return;
		event.preventDefault();
		const rect = dialog.getBoundingClientRect();
		drag = {
			pointerId: event.pointerId,
			pointerX: event.clientX,
			pointerY: event.clientY,
			left: Math.max(EDGE_GAP, rect.left),
			top: Math.max(EDGE_GAP, rect.top),
			width: rect.width,
			height: rect.height,
		};
		// Freeze the top-left corner. A centred Bootstrap dialog otherwise moves
		// both edges and leaves the pointer detached from the resize handle.
		dialog.style.position = "absolute";
		dialog.style.left = `${Math.round(drag.left)}px`;
		dialog.style.top = `${Math.round(drag.top)}px`;
		dialog.style.margin = "0";
		dialog.style.width = `${Math.round(rect.width)}px`;
		dialog.style.height = `${Math.round(rect.height)}px`;
		handle.setPointerCapture?.(event.pointerId);
	}

	function reset() {
		stop();
		storage?.removeItem?.(storageKey);
		for (const property of ["position", "left", "top", "margin", "width", "height"]) {
			dialog.style.removeProperty(property);
		}
	}

	handle.addEventListener("pointerdown", start);
	windowObject.addEventListener("pointermove", move);
	windowObject.addEventListener("pointerup", stop);
	windowObject.addEventListener("pointercancel", stop);
	handle.addEventListener("dblclick", reset);

	return {
		reset,
		destroy() {
			stop();
			handle.removeEventListener("pointerdown", start);
			windowObject.removeEventListener("pointermove", move);
			windowObject.removeEventListener("pointerup", stop);
			windowObject.removeEventListener("pointercancel", stop);
			handle.removeEventListener("dblclick", reset);
		},
	};
}
