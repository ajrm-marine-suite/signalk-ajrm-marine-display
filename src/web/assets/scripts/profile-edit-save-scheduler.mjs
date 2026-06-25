export function createProfileEditSaveScheduler({
	saveProfiles,
	refresh,
	delayMs = 500,
	refreshDelayMs = 250,
	setTimeoutFn = setTimeout,
	clearTimeoutFn = clearTimeout,
	onError = (error) => console.error("Error saving sensitivity", error),
}) {
	let saveTimer = null;

	async function saveNow() {
		if (saveTimer) {
			clearTimeoutFn(saveTimer);
			saveTimer = null;
		}
		await saveProfiles();
		setTimeoutFn(refresh, refreshDelayMs);
	}

	function scheduleSave() {
		if (saveTimer) clearTimeoutFn(saveTimer);
		saveTimer = setTimeoutFn(() => {
			saveTimer = null;
			saveNow().catch(onError);
		}, delayMs);
	}

	return {
		saveNow,
		scheduleSave,
	};
}
