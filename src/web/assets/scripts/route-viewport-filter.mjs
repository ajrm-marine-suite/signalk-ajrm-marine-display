/**
 * Filters compact route geometry against the current Leaflet map viewport.
 * A route qualifies when a waypoint is visible or a leg crosses the viewport.
 */

export function routeCrossesBounds(route, bounds) {
	const points = normalizePoints(route?.spatial?.coordinates);
	const rectangles = normalizeBounds(bounds);
	if (points.length < 2 || !rectangles.length) return false;
	if (points.some((point) => rectangles.some((rectangle) => pointInside(point, rectangle)))) {
		return true;
	}
	for (let index = 1; index < points.length; index += 1) {
		const start = points[index - 1];
		const end = unwrapLongitude(points[index], start[0]);
		for (const rectangle of rectangles) {
			for (const offset of [-360, 0, 360]) {
				if (segmentIntersectsRectangle(start, end, shiftRectangle(rectangle, offset))) return true;
			}
		}
	}
	return false;
}

export function filterRoutesForBounds(routes, bounds, enabled) {
	const entries = Array.isArray(routes) ? routes : [];
	return enabled ? entries.filter((route) => routeCrossesBounds(route, bounds)) : entries;
}

function normalizePoints(value) {
	if (!Array.isArray(value)) return [];
	return value
		.filter((point) =>
			Array.isArray(point) &&
			Number.isFinite(Number(point[0])) &&
			Number.isFinite(Number(point[1])),
		)
		.map(([longitude, latitude]) => [Number(longitude), Number(latitude)]);
}

function normalizeBounds(bounds) {
	const west = Number(bounds?.getWest?.() ?? bounds?.west);
	const south = Number(bounds?.getSouth?.() ?? bounds?.south);
	const east = Number(bounds?.getEast?.() ?? bounds?.east);
	const north = Number(bounds?.getNorth?.() ?? bounds?.north);
	if (![west, south, east, north].every(Number.isFinite) || south > north) return [];
	if (west <= east) return [{ west, south, east, north }];
	return [
		{ west, south, east: 180, north },
		{ west: -180, south, east, north },
	];
}

function unwrapLongitude([longitude, latitude], referenceLongitude) {
	let adjusted = longitude;
	while (adjusted - referenceLongitude > 180) adjusted -= 360;
	while (adjusted - referenceLongitude < -180) adjusted += 360;
	return [adjusted, latitude];
}

function shiftRectangle(rectangle, offset) {
	return {
		...rectangle,
		west: rectangle.west + offset,
		east: rectangle.east + offset,
	};
}

function pointInside([longitude, latitude], rectangle) {
	return longitude >= rectangle.west && longitude <= rectangle.east &&
		latitude >= rectangle.south && latitude <= rectangle.north;
}

function segmentIntersectsRectangle(start, end, rectangle) {
	if (pointInside(start, rectangle) || pointInside(end, rectangle)) return true;
	const corners = [
		[rectangle.west, rectangle.south],
		[rectangle.east, rectangle.south],
		[rectangle.east, rectangle.north],
		[rectangle.west, rectangle.north],
	];
	for (let index = 0; index < corners.length; index += 1) {
		if (segmentsIntersect(start, end, corners[index], corners[(index + 1) % corners.length])) {
			return true;
		}
	}
	return false;
}

function segmentsIntersect(a, b, c, d) {
	const orientations = [orientation(a, b, c), orientation(a, b, d), orientation(c, d, a), orientation(c, d, b)];
	if (orientations[0] !== orientations[1] && orientations[2] !== orientations[3]) return true;
	return orientations[0] === 0 && onSegment(a, c, b) ||
		orientations[1] === 0 && onSegment(a, d, b) ||
		orientations[2] === 0 && onSegment(c, a, d) ||
		orientations[3] === 0 && onSegment(c, b, d);
}

function orientation([ax, ay], [bx, by], [cx, cy]) {
	const cross = (by - ay) * (cx - bx) - (bx - ax) * (cy - by);
	if (Math.abs(cross) < 1e-12) return 0;
	return cross > 0 ? 1 : 2;
}

function onSegment([ax, ay], [bx, by], [cx, cy]) {
	return bx <= Math.max(ax, cx) && bx >= Math.min(ax, cx) &&
		by <= Math.max(ay, cy) && by >= Math.min(ay, cy);
}
