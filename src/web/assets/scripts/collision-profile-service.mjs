import {
	normalizeCollisionProfiles as normalizeCollisionProfilesWithDefaults,
	normalizeVesselSizeConfig as normalizeVesselSizeConfigWithDefaults,
	vesselSizeCategory as classifyVesselSize,
} from "./profile-settings.mjs";
import {
	getCollisionProfilesPath,
	refreshCollisionProfilesPath,
	setCollisionProfilesPath,
} from "./collision-profile-routes.mjs";
import {
	aisPlusAuthHeaders,
	assertAisPlusResponseAllowed,
} from "./ais-plus-api-access.mjs";

export function createCollisionProfileService({
	pluginId,
	defaultProfiles,
	getHttpResponse,
}) {
	function normalizeVesselSizeConfig(value = {}) {
		return normalizeVesselSizeConfigWithDefaults(
			value,
			defaultProfiles.vesselSize,
		);
	}

	function normalizeCollisionProfiles(profiles) {
		return normalizeCollisionProfilesWithDefaults(profiles, defaultProfiles);
	}

	function vesselSizeCategory(target, profiles) {
		return classifyVesselSize(target, profiles?.vesselSize);
	}

	async function loadProfiles() {
		let profiles = await getHttpResponse(getCollisionProfilesPath(pluginId), {
			throwErrors: true,
		});
		if (!profiles.current) {
			profiles = structuredClone(defaultProfiles);
			await saveProfiles(profiles);
		}
		return normalizeCollisionProfiles(profiles);
	}

	async function saveProfiles(profiles) {
		const normalizedProfiles = normalizeCollisionProfiles(profiles);

		const response = await fetch(setCollisionProfilesPath(pluginId), {
			credentials: "include",
			method: "PUT",
			body: JSON.stringify(normalizedProfiles),
			headers: aisPlusAuthHeaders({
				"Content-Type": "application/json",
			}),
		});
		if (!response.ok) {
			await assertAisPlusResponseAllowed(response, "AJRM Marine profiles");
			throw new Error(
				`Error selecting Traffic Core profile. Response status: ${response.status} from ${response.url}`,
			);
		}
		const body = await response.json().catch(() => ({}));
		return normalizeCollisionProfiles(body.profiles || normalizedProfiles);
	}

	async function refreshProfiles() {
		return normalizeCollisionProfiles(
			await getHttpResponse(refreshCollisionProfilesPath(pluginId), {
				throwErrors: true,
			}),
		);
	}

	return {
		loadProfiles,
		normalizeCollisionProfiles,
		normalizeVesselSizeConfig,
		refreshProfiles,
		saveProfiles,
		vesselSizeCategory,
	};
}
