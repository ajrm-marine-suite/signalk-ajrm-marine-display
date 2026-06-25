export function storedTrue(storage, key) {
	return storage.getItem(key) === "true";
}

export function storedNotFalse(storage, key) {
	return storage.getItem(key) !== "false";
}

export function speechOutputDefaultsFromServer(settings = {}) {
	return {
		pi: settings?.piSpeech !== false,
		stream: settings?.audioStream !== false,
		muted: settings?.muted === true,
		automute: settings?.automuteStationary === true,
		automuteStationarySpeed: Number.isFinite(
			Number(settings?.automuteStationarySpeed),
		)
			? Number(settings.automuteStationarySpeed)
			: 0.35,
	};
}
