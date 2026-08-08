/**
 * Implements the app profile edit startup responsibilities of the AJRM Marine Display browser application.
 */

export function initializeProfileEditView({ profileEdit, profile = "anchor" }) {
	profileEdit.setupProfileEditView(profile);
}
