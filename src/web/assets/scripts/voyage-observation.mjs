import {
	ajrmMarineAuthHeaders,
	assertAjrmMarineResponseAllowed,
} from "./ajrm-marine-api-access.mjs";

export function voyageObservationStatusPath(_pluginId) {
	return "/signalk/v1/api/ajrmMarineDisplay/observations/status";
}

export function voyageObservationPath(_pluginId) {
	return "/signalk/v1/api/ajrmMarineDisplay/observations";
}

export function normalizeVoyageObservationStatus(value = {}) {
	return {
		captureAvailable: value.captureAvailable === true,
		voyageActive: value.voyageActive === true,
		voyageId:
			typeof value.voyageId === "string" && value.voyageId.trim()
				? value.voyageId.trim()
				: null,
		snapshotAvailable: value.snapshotAvailable === true,
		maximumTextCharacters:
			Number.isInteger(value.maximumTextCharacters) &&
			value.maximumTextCharacters > 0
				? value.maximumTextCharacters
				: 2000,
	};
}

export function createVoyageObservationController({
	pluginId,
	controls,
	fetchFn = globalThis.fetch,
}) {
	let snapshotPreference = true;
	let latestStatus = normalizeVoyageObservationStatus();
	let saving = false;

	function init() {
		controls.modal.addEventListener("show.bs.modal", refreshStatus);
		controls.modal.addEventListener("shown.bs.modal", () =>
			controls.text.focus?.(),
		);
		controls.form.addEventListener("submit", submit);
		controls.includeSnapshot.addEventListener("change", () => {
			snapshotPreference = controls.includeSnapshot.checked;
		});
		applyStatus(latestStatus);
	}

	async function refreshStatus() {
		setMessage("Checking voyage recording…", "muted");
		setSaveEnabled(false);
		try {
			const response = await fetchFn(voyageObservationStatusPath(pluginId), {
				credentials: "include",
				cache: "no-store",
				headers: ajrmMarineAuthHeaders(),
			});
			await assertAjrmMarineResponseAllowed(
				response,
				"AJRM Marine voyage observations",
			);
			if (!response.ok) {
				throw new Error(await responseError(response));
			}
			latestStatus = normalizeVoyageObservationStatus(
				await response.json(),
			);
			controls.text.maxLength = latestStatus.maximumTextCharacters;
			applyStatus(latestStatus);
			return latestStatus;
		} catch (error) {
			latestStatus = normalizeVoyageObservationStatus();
			applyStatus(latestStatus);
			setMessage(error.message || "Unable to check voyage recording.", "danger");
			return latestStatus;
		}
	}

	async function submit(event) {
		event?.preventDefault?.();
		if (saving || !latestStatus.voyageActive) return false;
		const text = String(controls.text.value || "").trim();
		if (!text) {
			setMessage("Enter an observation before saving.", "danger");
			controls.text.focus?.();
			return false;
		}

		saving = true;
		setSaveEnabled(false);
		setMessage("Saving observation…", "muted");
		try {
			const response = await fetchFn(voyageObservationPath(pluginId), {
				credentials: "include",
				method: "POST",
				headers: ajrmMarineAuthHeaders({
					"Content-Type": "application/json",
				}),
				body: JSON.stringify({
					text,
					includeSnapshot:
						latestStatus.snapshotAvailable &&
						controls.includeSnapshot.checked,
				}),
			});
			await assertAjrmMarineResponseAllowed(
				response,
				"AJRM Marine voyage observations",
			);
			if (!response.ok) {
				throw new Error(await responseError(response));
			}
			const body = await response.json();
			const recordedAt =
				body?.observation?.recordedAt || body?.observation?.observedAt;
			const evidenceError = body?.observation?.evidenceError;
			const postCommitWarning = body?.observation?.postCommitWarning;
			controls.text.value = "";
			const savedPrefix = recordedAt
				? `Observation saved at ${formatObservationTime(recordedAt)}`
				: "Observation saved";
			const warnings = [
				evidenceError
					? `its diagnostic snapshot failed: ${evidenceError}`
					: null,
				postCommitWarning
					? `the text is safe and must not be re-entered, but ${postCommitWarning}`
					: null,
			].filter(Boolean);
			setMessage(
				warnings.length
					? `${savedPrefix}; ${warnings.join("; ")}.`
					: `${savedPrefix}.`,
				warnings.length ? "warning" : "success",
			);
			return true;
		} catch (error) {
			setMessage(error.message || "Unable to save observation.", "danger");
			return false;
		} finally {
			saving = false;
			setSaveEnabled(latestStatus.voyageActive);
		}
	}

	function applyStatus(status) {
		controls.includeSnapshot.disabled = !status.snapshotAvailable;
		controls.includeSnapshot.checked =
			status.snapshotAvailable && snapshotPreference;
		controls.snapshotHelp.textContent = status.snapshotAvailable
			? "Adds a structured Signal K and AJRM diagnostic snapshot at the same time. It is not a screen image."
			: "Diagnostic snapshots are unavailable; the text observation can still be saved.";

		if (!status.captureAvailable) {
			setSaveEnabled(false);
			setMessage(
				"AJRM Marine Capture observation support is unavailable.",
				"danger",
			);
			return;
		}
		if (!status.voyageActive) {
			setSaveEnabled(false);
			setMessage(
				"Start a voyage recording in AJRM Marine Capture before adding observations.",
				"muted",
			);
			return;
		}
		setSaveEnabled(true);
		setMessage(
			status.voyageId
				? `Saving to ${status.voyageId}.`
				: "An active voyage is ready for observations.",
			"muted",
		);
	}

	function setSaveEnabled(enabled) {
		controls.save.disabled = saving || enabled !== true;
	}

	function setMessage(message, tone) {
		controls.status.textContent = message;
		controls.status.classList.toggle("text-danger", tone === "danger");
		controls.status.classList.toggle("text-success", tone === "success");
		controls.status.classList.toggle("text-warning", tone === "warning");
		controls.status.classList.toggle("text-body-secondary", tone === "muted");
	}

	return {
		applyStatus,
		init,
		refreshStatus,
		submit,
	};
}

function formatObservationTime(value) {
	const date = new Date(value);
	return Number.isFinite(date.getTime())
		? date.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			})
		: String(value);
}

async function responseError(response) {
	const body = await response.json().catch(() => null);
	return (
		body?.error ||
		`${response.status || ""} ${response.statusText || ""}`.trim() ||
		"Request failed"
	);
}
