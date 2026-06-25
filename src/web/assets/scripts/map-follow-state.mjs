import { DISPLAY_CONTROL_ICONS } from "./display-control-icons.mjs";

export function mapFollowButtonState(following) {
	return following
		? {
				html: DISPLAY_CONTROL_ICONS.follow,
				title: "Following own vessel",
			}
		: {
				html: `<span class="position-relative d-inline-flex align-items-center justify-content-center">${DISPLAY_CONTROL_ICONS.follow}<span class="text-danger position-absolute top-50 start-50 translate-middle">${DISPLAY_CONTROL_ICONS.slash}</span></span>`,
				title: "Follow paused. Click to centre own vessel",
			};
}
