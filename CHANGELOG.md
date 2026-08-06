# Changelog

## 0.6.20

- Keep the smallest-area, most detailed chart selected as map zoom increases,
  including through raster overzoom, instead of replacing it with a broader
  chart merely because that chart has a higher minimum zoom level.
- Cover the observed Cuan Sound Antares-to-Admiralty replacement with a focused
  Auto Charts regression test.

## 0.6.19

- Draw SAR aircraft with a simple top-down aircraft silhouette on the map,
  aligned with heading or course over ground.
- Use the same aircraft silhouette in the AIS target table while retaining the
  existing emergency-beacon symbol for AIS-SART, MOB-AIS, and EPIRB-AIS.

## 0.6.18

- Identify exact ITU `111MIDXXX` targets as visible non-collision SAR aircraft.
- Show the SAR-aircraft category and optional fixed-wing/helicopter subtype in
  vessel details while keeping ordinary-MMSI hovercraft as collision targets.

## 0.6.17

- Align zoomed-in target footprints with heading true when available.
- Fall back to course over ground when AIS heading is explicitly unavailable,
  instead of interpreting the missing value as north.

## 0.6.16

- Make the own-vessel map marker selectable and open the existing vessel-status
  popup without invoking the nearby-target chooser.
- Label own-vessel status explicitly and omit collision-relative fields and
  target-silencing controls that do not apply to the vessel itself.
- Preserve the normal own-vessel course projection while its status popup is
  selected.

## 0.6.15

- Add a Signal K Plugin Config default for latitude/longitude formatting with
  degrees/minutes/seconds, degrees/decimal-minutes, and decimal-degrees modes.
- Add an immediate per-browser format selector under **Settings → Device
  display**, remembered locally and applied to both the chart cursor and vessel
  details.

## 0.6.14

- Add an optional DR Plotter-style chart cursor box showing latitude and
  longitude, plus range and true bearing from own vessel when its position is
  available.
- Store the enable/disable choice locally on each browser device and keep
  cursor movement entirely client-side without triggering server refreshes.

## 0.6.13

- Prevent new duplicate Signal K route names at the route-manager boundary.
- Reuse and update the existing Signal K resource when a same-named GPX route
  is reopened, while rejecting ambiguous imports if duplicates already exist.
- Require a unique name for Save As, using case-insensitive name comparison.
- Add confirmed deletion of the selected Signal K route resource, with UUID
  prefixes shown so pre-existing duplicates can be distinguished safely.

## 0.6.12

- Correct the 90-degree route-arrow offset by converting compass bearings,
  which start at north, to the east-pointing arrow glyph's CSS rotation.

## 0.6.11

- Add a display-only route manager for browser GPX files, Pi GPX files and
  Signal K v2 route resources.
- Draw the active route with configurable colour, width and direction arrows;
  reverse it with a toggle and persist the reversed order when saved.
- Import and export GPX 1.1 while retaining useful OpenCPN route and waypoint
  extensions.
- Accept Savvy Navvy's metadata-named routes with unnamed route points and
  generate stable waypoint labels.
- Publish an explicit active-route contract for Capture voyage recording and
  replay restoration without silently activating the Signal K Course API.

## 0.6.10

- Restore MMSI MID country derivation in the active vessel snapshot pipeline,
  so MMSI `232035943` and other UK targets show `GB` with the correct country
  tooltip instead of `---`.
- Render the MMSI country tooltip as focusable text rather than a dead `#`
  hyperlink.

## 0.6.9

- Add a prominent Help warning that avoidance prompts are limited indications
  rather than COLREG advice, identify missing situational inputs such as
  sailing versus motoring, and retain skipper responsibility.

## 0.6.8

- Read replay state and original voyage time from
  `plugins.ajrmMarineCapture.playback`.
- Remove the Display runtime dependency on the retired Logger path.

## 0.6.7

- Keep own vessel at its last known position when replay ends or GPS becomes
  stale, while allowing stale AIS targets to clear normally.
- Remove stale own-vessel motion vectors and render its retained icon grey,
  using the last known heading or COG only to preserve icon orientation.

## 0.6.6

- Expose Display's active-alert panel projection through its in-process runtime
  API so suite BITE can verify that resolved historical alerts are absent.

## 0.6.5

- Keep the bottom Active Alerts panel sourced exclusively from the
  Notifications broker's active projection.
- Do not substitute resolved recent activity when no active alert exists.

## 0.6.4

- Drive browser announcements only from explicit broker audio-delivery events.
- Do not build a native browser speech backlog while the Display tab or window
  is hidden or unfocused; cancel pending speech when it moves to the background.
- Queue only one fresh browser utterance at a time and discard expired events
  instead of speaking them when focus returns.

## 0.6.3

- Add a browser-local own-vessel icon direction setting for Heading or COG.
- In Heading mode, use qualified bow heading and explicitly fall back to COG
  only when heading is unavailable.
- Render a neutral own-vessel symbol rather than false north when the selected
  direction is unavailable.
- Keep standard projected tracks, selected-target course lines, and profile
  TCPA guide lines tied to COG regardless of the icon direction setting.

## 0.6.2

- Render evidence-backed AIS Class A, Class B, and unknown targets instead of
  defaulting every vessel to Class A.
- Clear a cached target turn indicator when Traffic or raw Signal K publishes
  an explicit null rate of turn.
- Add a persisted, self-only own-vessel icon size setting from 50% to 150%.
- Add a Display voyage-observation modal that saves timestamped text through
  Capture, with optional structured Snapshot evidence that cannot cause the
  text note to be lost.

## 0.6.1

- Use AJRM Marine Navigation Reference schema v1 as the authoritative
  own-vessel position, coherent COG/SOG, and qualified bow-heading source while
  retaining its source, freshness, uncertainty, and clock-reference provenance.
- Withhold mixed raw own-motion values when the provider is present but cannot
  supply a valid value.
- Require strict numeric schema version 1 and a valid provider `updatedAt`
  within 15 seconds; withhold malformed, unsupported, or stale provider states
  instead of falling back to unrelated raw navigation.
- Preserve a valid zero-radian heading instead of falling through to COG, and
  hide projected course/TCPA guides when COG is unavailable instead of drawing
  a false northbound line.

## 0.5.28

- Fix Display CPA limit rings to use metre profile thresholds directly instead
  of multiplying them by metres-per-nautical-mile. This prevents huge Leaflet
  circles and Safari/Chrome slowdowns when simulator targets are active.

## 0.5.27

- Add a range-rings debug control to isolate SVG overlay work from the rest of
  the Leaflet overlay pane during browser frame-stall diagnostics.

## 0.5.26

- Extend transient Display debug controls to hide the map container and
  individual Leaflet panes while investigating browser frame stalls.

## 0.5.25

- Add transient Signal K debug controls for toggling Display target rendering
  features while browser diagnostics are enabled.

## 0.5.24

- Add browser main-thread event-loop lag and animation-frame gap diagnostics
  through Signal K debug logging when Display browser refresh diagnostics are
  enabled.

## 0.5.23

- Prevent overlapping browser refresh cycles when a previous refresh takes
  longer than the configured interval.
- Include skipped-overlap counts in Display refresh diagnostics.

## 0.5.22

- Emit periodic Display browser refresh diagnostic samples through Signal K
  debug logging whenever browser refresh diagnostics are enabled, not only for
  refreshes above the slow threshold.

## 0.5.21

- Move browser refresh diagnostics behind a Display plugin config option and
  report slow samples through Signal K `app.debug()` logging.

## 0.5.20

- Write slow-refresh diagnostics to a Signal K data-dir NDJSON log instead of
  repeatedly logging full objects to Chrome DevTools.
- Throttle browser diagnostic reports to reduce debug overhead while Display is
  already slow.

## 0.5.19

- Expose Display refresh diagnostics through a stable
  `window.AJRMMarineDisplayDebug` browser-console object.

## 0.5.18

- Add opt-in browser refresh diagnostics for Display slowdowns, including
  per-refresh phase timings and retained target, marker, overlay, and label
  counts for simulator debugging.

## 0.5.17

- Rename Display's internal stationary mute threshold setting to stationary
  automute speed, matching the Traffic policy semantics.

## 0.5.16

- Keep the Replay status visible whenever Logger explicitly reports playback
  active, even if the current replay timestamp is missing or unparsable.

## 0.5.15

- Fix the Help/Settings CPA table to treat profile CPA thresholds as metres,
  matching the Traffic profile contract, instead of formatting old nautical-mile
  shaped values.

## 0.5.14

- Store and send Traffic profile CPA thresholds as metres while continuing to
  display larger profile distances in NM in the browser controls.
- Update Display's default profile thresholds to match Traffic's metre-based
  profile contract.

## 0.5.11

- Let the GPS status lamp fall back to fresh standard Signal K own-vessel
  position/GNSS data when AJRM Marine GPS Integrity is not installed.

## 0.5.10

- Use MMSI, Signal K UUID, or the vessel collection key as the target identity,
  so own-vessel simulators without an MMSI can still be followed and centred.

## 0.5.9

- Default first-run maps to OpenSeaMap seamarks on and Auto Charts off, so the
  Display is useful before local chart resources are installed.

## 0.5.8

- Rename Display legacy traffic-core and engine internals to AJRM Marine Traffic terminology and consume the updated traffic projection contract names.

## 0.5.7

- Rename Display browser namespaces, helper names, and status contracts to AJRM Marine naming.

## 0.5.6

- Replace the top-right target, filtered, and alarm counts with a compact GPS
  status lamp backed by AJRM Marine GPS Integrity.

## 0.5.5

- Preserve vessel-database-filled dimensions in Display target popups when the
  Traffic projection has not yet supplied length and beam.

## 0.5.4

- Keep the Auto Profile switch state from the Traffic command response instead
  of immediately overwriting it with a stale Display status refresh.

## 0.5.3

- Add a visible Sounds title to the Display audio mode selector.

## 0.5.2

- Add top-level Display audio mode controls for Auto, On, and Off.
- Preserve Traffic profile stationary automute settings when Display saves profiles.

## 0.5.1

- Remove obsolete profile-range settings, help text, and editor controls.

## 0.5.0

- Initial public beta release as AJRM Marine Display.
