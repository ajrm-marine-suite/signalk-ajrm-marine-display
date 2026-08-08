/**
 * Owns state and transitions for target map renderer count in the AJRM Marine Display browser application.
 */

export function createTargetMapRendererCountState() {
	let valid = 0;
	let filtered = 0;
	let alarm = 0;

	return {
		add(counts = {}) {
			valid += counts.valid || 0;
			filtered += counts.filtered || 0;
			alarm += counts.alarm || 0;
		},
		alarmCount() {
			return alarm;
		},
		reset() {
			valid = 0;
			filtered = 0;
			alarm = 0;
		},
		snapshot() {
			return { valid, filtered, alarm };
		},
	};
}
