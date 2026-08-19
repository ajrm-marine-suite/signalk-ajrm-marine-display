# Changelog

## 0.8.16

- Include a **No Auto chart** step in Display's chart cycle so the selected
  basemap can be exposed without switching Auto Charts off.
- Give **Use automatic selection** a blue action outline so an enabled control
  no longer resembles a disabled grey button.

## 0.8.15

- Load automatic profile areas directly from the shared Locations service;
  remove Signal K `Harbour:` region discovery and prefix handling.
- Expose the direct profile-area projection to Snapshot and BITE.
- Ship a package-root 120-pixel PNG icon for reliable Signal K Webapps display.

## 0.8.14

- Use Map Core's shared tide-curve renderer, keeping Display and Marine
  Planning on one chart-datum, reference-level and hover implementation.

## 0.8.13

- Rename the alternative-port control to the selected tidal port and remove
  persistent pinning from normal manual selection.
- Make automatic selection follow a valid live vessel position, falling back
  to the visible chart centre when own position is unavailable.
- List usable secondary ports as well as direct-provider standard ports.

## 0.8.12

- Apply an alternative tidal-port selection immediately and retain its
  explicit port ID during normal polling and forced provider refreshes.
- Clear all station-derived measurements, source details and curve data while
  the selected port is loading, unavailable or has no fetched predictions.
- Ignore late tide responses after a newer port choice, preventing an earlier
  automatic Oban result from replacing the current selection.

## 0.8.11

- Fix the tide graph lower edge at 0 m Chart Datum and label the baseline, so
  MLWS remains visibly separated from the bottom of the plot.

## 0.8.10

- Remember the user-resized tide-dialog dimensions in browser storage and
  restore them within the current viewport; double-click still resets them.
- Draw available MHWS, MHWN, MLWN and MLWS station levels as labelled light
  dotted lines behind the predicted curve.
- Show interpolated local time and predicted height while hovering over the
  tide curve.
- Show **Distance to fall** as current predicted height minus the next
  low-water height, during both rising and falling tides.

## 0.8.9

- Replace unreliable CSS-native tide-dialog resizing with an explicit visible
  bottom-right drag handle using Pointer Events.
- Keep the dialog's top-left corner fixed while resizing and bound its minimum
  and maximum size to usable desktop dimensions and the current viewport.
- Allow a double-click on the resize handle to restore the default centred
  dialog size.

## 0.8.8

- Verify that explicit UTC tide events render as BST during British Summer
  Time and GMT during winter, without a hard-coded seasonal offset.
- Restore a smaller default tide-popup footprint for compact desktop displays.
- Allow desktop users to resize the tide popup in both dimensions while
  bounding it to the viewport and retaining internal scrolling.

## 0.8.7

- Split tide information into Details and Graph tabs so the popup presents one
  task at a time and the curve can use the full modal width.
- Increase horizontal spacing between tidal extremes to prevent two-line
  day/date and time labels from overlapping.
- Use the extra-large responsive modal width where the browser permits it,
  while retaining horizontal graph scrolling on smaller screens.

## 0.8.6

- Put low-water heights below their troughs while retaining high-water heights
  above their peaks.
- Split each tide-extreme timestamp across a day/date line and a time line.
- Add dedicated graph margins and slightly more horizontal spacing so labels
  remain visible rather than being clipped by the graph boundary.

## 0.8.5

- Add an explicitly labelled astronomical spring-neap estimate to the tide
  popup, showing whether ranges are building toward spring or easing toward
  neap and the days since the preceding phase and until the next one.
- Explain that actual local spring/neap range may lag the corresponding lunar
  phase and remains subordinate to the selected station's plotted prediction.

## 0.8.4

- Use one programmatic owner for the tide modal instead of mixing Bootstrap's
  hidden data launcher with an existing modal instance. Closing tide details
  no longer leaves the chart toolbar obscured by modal state.
- Add a remembered one-to-seven-day tide-graph range, defaulting to seven
  days, with a horizontally scrollable multi-day curve and day/time labels.

## 0.8.3

- Resolve tides for the visible chart centre and preserve that context while
  refreshing, pinning an alternative port or restoring automatic selection.
  This avoids a false no-port result when Display is inspecting an area
  without a current own-vessel position.

## 0.8.2

- Supplies the persisted manual anchor reference to Traffic's sustained release monitor.
- Documents the default speed and anchor-radius release conditions in onboard help.

## 0.8.1

- Show Location Editor's backend anchoring suggestion prominently on the map
  and let the skipper confirm Anchored or dismiss the suggestion.
- Keep manual **Drop Anchor** separate so confirmation never fabricates the
  physical anchor position or depth.

## 0.8.0

- Add optional chart symbols for anchorages/moorings and other versioned AJRM
  locations, with stored details available from each popup.
- Add a compact tide-status panel and a detailed tide popup containing current
  height, trend, next high/low waters, datum, station, source freshness and an
  interpolated curve.
- Explain why the shared resolver selected its current tidal port and preserve
  visibility of the automatic candidate beneath a manual pin.
- Add authenticated controls to pin an alternative configured prediction port,
  restore automatic selection and refresh the shared provider data.
- Keep all tidal selection, provider access, interpolation and caching in
  Location Editor's shared resolver rather than copying it into Display.

## 0.7.11

- Extend current-chart-area filtering to GPX routes on the browser device.
- Allow selecting several GPX files or a whole local folder, including files
  containing more than one route, before choosing which route to open.
- Keep local route indexing and map-move filtering in the browser without
  repeated uploads or server requests.

## 0.7.10

- Add an optional route-picker filter for Pi GPX files and Signal K routes that
  have a waypoint in, or a route leg crossing, the current chart area.
- Cache Pi GPX spatial summaries in memory by file size and modification time,
  reparsing only new or changed files without creating sidecar files.

## 0.7.9

- Add an explicit transient route-selection runtime contract for Simulator GPX routes.
- Keep Simulator-selected routes out of saved Signal K resources until explicitly saved.

## 0.7.8

- Darken the retained last-fix own-vessel marker so it remains clearly visible
  over detailed chart artwork while preserving the red no-GPS cross.
- Persist the last valid live own-vessel fix in browser storage so the marked
  position survives a hard refresh during GPS loss; replay fixes are excluded.

## 0.7.7

- Retain own vessel at its last valid live position when Signal K keeps the
  self context but clears `navigation.position` after GPS loss.
- Keep the chart at that last fix, clear motion/course projection, dim the
  marker, and add an explicit red cross plus **LAST FIX — NO GPS** tooltip.
- Add regression coverage for the live null-position snapshot shape.

## 0.7.6

- Disable the chart-cycle toolbar button and keyboard shortcut whenever Auto
  Charts is off, without displaying a misleading chart-cycle banner.

## 0.7.5

- Move Drop Anchor into Display's Profiles menu and select Traffic's Anchored
  profile through its authoritative API.
- Persist and display an anchor symbol at the recorded own-vessel position,
  labelled with the depth below keel captured at the time of the drop.
- Remove the marker automatically when Traffic leaves Anchored; **Un-anchor**
  explicitly selects Coastal and removes it.

## 0.7.4

- Shift own-vessel follow along the explicit Signal K COG so 66% of the visible
  chart is ahead and 34% behind by default.
- Add a browser setting for 50-80% chart space ahead, shared with DR Plotter.
- Keep own vessel exactly centred whenever COG is unavailable.
- Adopt AJRM Marine Map Core 0.7.2 for the common look-ahead calculation.

## 0.7.3

- Add concise purpose headers to every maintained runtime module so its role is
  clear before reading implementation details.
- Add a regression check that prevents new source modules from being introduced
  without a module-purpose header.
- Align OpenAPI metadata with the package release and test that the versions do
  not drift apart again.
- Preserve existing runtime contracts and behaviour following a suite-wide
  maintainability and Signal K integration review.
- Repair stale browser `version.json` cache markers and align them with the
  package release.

## 0.7.2

- Correct the package-relative Signal K App Store icon path.

## 0.7.1

- Adopt reviewed AJRM Marine Map Core 0.7.0, including complete chart-selector
  listener cleanup when a map is destroyed or recreated.

## 0.7.0

- Complete a Signal K ownership, lifecycle, authorization and API review.
- Send sound checks to AJRM Marine Audio, announcement-history clearing to
  AJRM Marine Notifications, and all-well policy changes to AJRM Marine
  Traffic instead of calling obsolete Display endpoints.
- Require Signal K read/write or administrator access for every mutation and
  document every registered route in OpenAPI.
- Retract Display status and its in-process API on stop, and prevent delayed
  route initialization from reviving stopped runtime state.
- Permit browser speech only when Notifications explicitly marks the latest
  event for audio delivery.
- Remove the nonexistent GPS-warning pause call, dead browser announcement
  logging, the unimplemented CPA vessel-shape setting, and unused Lodash.
- Remove the dormant 553-line Display-side CPA/risk calculator. Production
  Display used only its degree/radian helpers; Traffic remains the sole live
  collision-risk authority.
- Keep Traffic and Vessel Database as separate authorities: live risk state
  and durable vessel identity respectively.

## 0.6.32

- Refresh embedded Help for shared map controls, nested chart folders, route
  handling, voyage observations, vessel popups, SAR aircraft, and the
  Capture-led recording/replay architecture.

## 0.6.31

- Add visible hover/focus help to zoom, chart, follow and application map
  icons, using AJRM Marine Map Core 0.6.11 for the shared label contract.

## 0.6.30

- Place Cycle chart immediately below the chart selector, matching DR Plotter,
  Voyage Viewer and Harbour Editor.

## 0.6.29

- Use Map Core's shared automatic/manual chart-selection state, chart-cycle
  result wording, keyboard filtering, shortcut normalization and chart-resource
  normalization.
- Keep Display-specific raster/MVT rendering, live catalogue refresh, fallback
  handling and operational layer ordering unchanged.

## 0.6.28

- Size the chart selector from its measured screen position to the bottom of
  the browser, keeping chart folders reachable in short windows.
- Enable contained mouse, touch and iPadOS momentum scrolling in the selector.

## 0.6.27

- Make AIS Targets, Profiles and Settings toolbar buttons true toggles: a
  second press now closes the panel opened by the first press.
- Treat an opening transition as open so a quick second press can close it.

## 0.6.26

- Offset left off-canvas panels so they no longer cover the map toolbar.
- Keep the left Leaflet toolbar above the off-canvas backdrop so zoom, chart
  and application buttons remain exposed while a panel is open.

## 0.6.25

- Make Display the suite reference for map and chart interaction.
- Consume the versioned AJRM Marine map core for the shared Auto Charts
  ranking contract used by Display, DR Plotter, Voyage Viewer and Harbour
  Editor.
- Keep Display's established chart selector, nested folder controls and
  overlap-cycle workflow as the reference presentation.

## 0.6.24

- Cache normalized chart bounds and zoom metadata when Auto Charts loads its
  catalogue, avoiding repeated parsing while zooming, panning and following
  own vessel.
- Preserve the established coordinate-order handling, overlap ranking and
  automatic cache replacement when chart resources refresh.

## 0.6.23

- Add nested Charts Provider Simple folder controls beneath Auto Charts in the
  Display chart selector.
- Apply folder changes globally through the provider API, refresh Auto Charts
  immediately, and show when a child folder is disabled by a parent.
- Hide the folder section when the installed Charts Provider Simple version
  does not yet provide the folder-management API.

## 0.6.22

- Add a visible Cycle chart map control for choosing among enabled charts that
  overlap the map centre, followed by a return to Automatic selection.
- Keep a manually selected chart locked through zoom and overzoom, while
  automatically releasing the lock after panning outside its coverage.
- Add a browser-local, configurable single-key shortcut for cycling charts,
  defaulting to `C`, with an on-map chart-name/status confirmation.

## 0.6.21

- Select the chart whose native maximum zoom most closely fits the current map
  zoom, preferring native coverage over an already-overzoomed chart.
- Use geographic coverage only to break native-resolution ties, so detailed
  Antares charts appear at an appropriate zoom and then remain through
  overzoom. At Cuan Sound this steps from the overview chart at zoom 13, to
  Admiralty 2326 at zooms 14–15, and to Antares from zoom 16 onward.

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
