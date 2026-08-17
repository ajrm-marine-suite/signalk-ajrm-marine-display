# AJRM Marine Display

Version `0.7.11` extends current-chart-area route filtering to GPX files on the
browser device. The device tab can index several selected GPX files or an
entire selected folder, list every route within them, and update the filtered
list locally as the chart moves. Browsers require the folder to be selected
again after a page reload; web pages cannot silently retain filesystem access.

Version `0.7.10` adds an optional current-chart-area filter to the route picker.
It finds routes with a waypoint in view and routes whose legs cross the visible
chart even when both endpoints are outside. Pi GPX geometry is cached in memory
by file size and modification time, so unchanged files are not repeatedly
parsed and no sidecar summary files need to be managed.

Version `0.7.9` adds a narrow runtime route-selection contract used by AJRM
Marine Simulator. A Simulator GPX selection becomes Display's active transient
route without creating or duplicating a saved Signal K route; it remains
available to Capture and can still be saved deliberately through Display.

Version `0.7.8` makes the retained live GPS last-fix vessel marker substantially
darker against chart artwork and retains it across a hard browser refresh.
Replay positions are not written to that live last-fix cache. Version `0.7.7`
restores last-known-position display after live GPS loss and adds an
unmistakable stale-fix marker. Version
`0.7.6` disables chart cycling,
including its keyboard shortcut, while
Auto Charts is off. This keeps the control state consistent across all AJRM
chart applications and prevents an irrelevant chart-name banner.

Version `0.7.5` moves **Drop Anchor** into the Profiles menu. It selects
Traffic's Anchored profile, records the current own-vessel position and depth
below keel, and places a persistent labelled anchor symbol on the chart.
**Un-anchor** always selects Coastal and removes the marker; changing away from
Anchored elsewhere removes it automatically.

Version `0.7.4` improves own-vessel following by leaving 66% of the visible
chart ahead along COG and 34% behind by default. The browser-local setting can
be adjusted from 50-80% and is shared with DR Plotter. If COG is unavailable,
the vessel stays centred.

Version `0.7.0` is the reviewed Signal K contract baseline. Display now sends
Traffic, Notifications and Audio controls directly to their authoritative
plugins, authenticates every mutation, documents every registered route in
OpenAPI, retracts its runtime status on stop, and speaks only events for which
Notifications explicitly selected audio delivery. Dead Display-owned sound,
history and GPS-pause calls and the unimplemented CPA vessel-shape control have
been removed. A dormant Display-side CPA/risk calculator has also been removed;
Display consumes Traffic's authoritative risk projection instead of carrying a
second safety engine.

Display owns map interaction and presentation. AJRM Marine Traffic owns live
target and collision-risk state; AJRM Marine Vessel Database remains a
separate durable identity and classification service.

<details>
<summary>Earlier release notes</summary>

Version `0.6.32` refreshed embedded Help for the shared map controls, chart
folders, route handling, voyage observations, and Capture-led architecture.

Version `0.6.31` adds visible hover/focus help to every map control icon,
including zoom, chart selection, chart cycling, follow and Display actions.

Version `0.6.30` places Cycle chart immediately below the chart selector,
matching DR Plotter, Voyage Viewer and Harbour Editor.

Version `0.6.28` keeps the complete chart selector, including chart folders,
inside short browser windows and enables reliable mouse/touch scrolling.

Version `0.6.27` makes the AIS Targets, Profiles and Settings map buttons close
their own panel when pressed a second time.

Version `0.6.26` opens left-side panels beside the map toolbar and keeps the
toolbar visible above the off-canvas backdrop.

Operational chart, target and alert Display for the AJRM Marine suite.

Version `0.6.25` establishes AJRM Marine Display as the reference map interface
for the suite and consumes the versioned AJRM map core for shared Auto Charts
ranking. DR Plotter, Voyage Viewer and Harbour Editor use the matching core
control, chart-folder hierarchy and overlap-cycling behaviour.

Version `0.6.24` caches normalized bounds and zoom metadata for the Auto Charts
catalogue. This keeps chart selection responsive with large collections while
preserving the established overlap, native-zoom and overzoom rules.

Version `0.6.23` adds a collapsible nested chart-folder list beneath **Auto
Charts** in the chart selector. With Charts Provider Simple 2.6.0 or later,
folder checkboxes enable or withdraw every chart beneath that folder across
Signal K, including nested folders. The list identifies child folders disabled
by a parent and Auto Charts refreshes immediately after a change. With an older
provider, the unsupported folder section remains hidden.

Version `0.6.22` adds a visible Cycle chart control and a browser-local,
configurable single-key shortcut (`C` by default). Each press selects the next
enabled chart overlapping the map centre, then returns to Automatic selection.
A manually selected chart remains locked through zoom and overzoom, but is
released automatically when the map centre leaves its coverage.

Version `0.6.19` identifies the ITU `111MIDXXX` allocation as SAR aircraft,
shows the category (including the optional fixed-wing or helicopter subtype)
in vessel details, draws a heading-aligned aircraft silhouette on the map and
target table, and treats the aircraft as a visible non-collision target.
Ordinary-MMSI hovercraft and other surface craft remain collision candidates.

Version `0.6.17` aligns each zoomed-in target footprint with its reported true
heading, falling back to course over ground when the target has no heading.

Version `0.6.16` makes the own-vessel marker selectable. Clicking it opens the
familiar vessel-detail popup, identifies it as **Own vessel**, and shows the
available identity, motion and position data without inapplicable collision or
silencing controls.

Version `0.6.15` adds a configurable latitude/longitude format for chart cursor
and vessel-detail coordinates. Signal K Plugin Config supplies the default;
**Settings → Device display** can change it immediately for an individual
browser and remembers that local choice.

Version `0.6.14` adds an optional DR Plotter-style chart cursor box. Enable it
under **Settings → Device display** to show cursor latitude/longitude and, when
own-vessel position is available, range and true bearing from the vessel. The
choice is stored locally for each browser device.

Version `0.6.13` prevents Display from creating duplicate Signal K route names,
reuses the existing resource when a same-named GPX route is reopened, and adds
confirmed deletion of a selected Signal K route resource. Existing duplicates
show their UUID prefix so they can be distinguished and removed deliberately.

Version `0.6.12` corrects route direction-arrow rotation so the arrowheads
align with the route rather than appearing at right angles to it.

Version `0.6.11` adds display-only route management. GPX 1.1 routes can be
opened from the browser or the configured Pi route directory, stored as Signal
K v2 route resources, reversed, saved and exported without activating the
Signal K Course API. The active route and later route changes are exposed to
AJRM Marine Capture so a replay can restore the same route timeline.

Version `0.7.7` restores last-fix retention for the live Signal K GPS-loss shape
where the own-vessel context remains but `navigation.position` becomes null or
is removed. Display keeps the chart at the last fix and leaves a dark-grey
own-vessel icon there with a red cross and **LAST FIX — NO GPS** tooltip. SOG,
COG, heading and course projection are cleared so the retained marker cannot be
mistaken for a continuing position estimate. The older stale/absent-context
cases remain supported.

Version `0.6.6` keeps the Active Alerts panel strictly active and exposes that
projection to suite BITE. Resolved alerts
and recent informational events remain available in history but no longer
appear in the bottom active-alert panel.

Version `0.6.4` prevents browser speech from accumulating while Display is
hidden or unfocused. It cancels pending browser speech on backgrounding,
discards expired delivery events, and queues no more than one fresh utterance
at a time.

Version `0.6.3` adds an explicit own-vessel icon direction setting. The icon
can follow qualified bow heading, with a labelled COG fallback when heading is
unavailable, or it can always follow COG. Projected track and TCPA guide lines
remain independently tied to COG. A directional icon becomes neutral rather
than falsely pointing north when its selected direction is unavailable.

Version `0.6.2` renders only evidence-backed Class A or Class B AIS reports,
shows unknown class explicitly, clears stale turn arrows on null rate-of-turn
updates, adds a self-only 50-150% own-vessel icon size control, and adds a
voyage-observation form backed by AJRM Marine Capture. Observations can include
a structured diagnostic Snapshot without risking loss of the text note.

Version `0.6.1` consumes AJRM Marine Navigation Reference schema v1 for
own-vessel position, coherent COG/SOG, and qualified bow heading. It preserves
the provider's source and clock-reference evidence, keeps valid 0° heading
values, and suppresses course/TCPA guides when no COG is available instead of
drawing them north. Provider schema version 1 must be numeric, and `updatedAt`
must be valid and no more than 15 seconds old. A present malformed, unsupported,
or stale provider is withheld rather than replaced with unrelated raw
navigation values.

Version `0.5.28` fixes CPA limit ring radii so metre profile thresholds are not
multiplied by metres-per-nautical-mile, avoiding huge map overlays when
simulator targets are active.

Version `0.5.27` adds a range-rings debug control to isolate SVG overlay work
from the rest of the Leaflet overlay pane during browser frame-stall diagnostics.

Version `0.5.26` extends transient Signal K debug controls so the map container
and individual Leaflet panes can be hidden while investigating browser frame
stalls.

Version `0.5.25` adds transient Signal K debug controls for toggling Display
target rendering features during browser diagnostics.

Version `0.5.24` adds browser main-thread and frame-gap diagnostics to help pin
down simulator-time UI stalls.

Version `0.5.23` prevents overlapping browser refresh cycles and includes
skipped-overlap counts in refresh diagnostics.

Version `0.5.22` emits periodic browser refresh diagnostic samples through
Signal K plugin debug logging when diagnostics are enabled.

Version `0.5.21` enables slow browser refresh diagnostics from Display's Signal
K plugin config and writes samples through Signal K plugin debug logging.

Version `0.5.19` exposes refresh diagnostics through
`window.AJRMMarineDisplayDebug` for browser-console debugging.

Version `0.5.18` adds opt-in browser refresh diagnostics for investigating
Display slowdowns after simulator runs.

Version `0.5.16` keeps the Replay status visible whenever Logger explicitly
reports playback active, even if the current replay timestamp is missing.

Version `0.5.15` keeps all Traffic profile CPA thresholds in metres, including
the Help/Settings CPA table, while browser controls may display larger values as
NM for readability.

Version `0.5.11` lets the GPS status lamp work in standalone/reduced mode by
falling back to fresh standard Signal K own-vessel position data when AJRM
Marine GPS Integrity is not installed.

Version `0.5.10` follows own-vessel simulator data that has a Signal K UUID but
no MMSI, so Display can auto-centre on third-party simulators such as SKsim.

Version `0.5.9` defaults first-run maps to OpenSeaMap seamarks on and Auto
Charts off, so new installs work sensibly before local chart resources are
installed.

Version `0.5.8` renames Display's browser namespaces and status contracts to
AJRM Marine naming.

Version `0.5.6` replaces the top-right target counters with a compact GPS
status lamp backed by AJRM Marine GPS Integrity.

Version `0.5.1` removes obsolete profile-range settings and editor controls.
CPA/TCPA profile limits remain the target-alert threshold controls.

Version `2.2.14` improves local CPA geometry by using midpoint latitude for
east-west target projection.

Version `2.2.13` uses Signal K distance display-unit metadata for target range
and CPA presentation while keeping raw target values in Signal K base units.

Version `2.2.12` lets browser speech finish the current announcement before
queued system or sound-state messages play, avoiding mid-sentence interruptions
during collision alarms.

Version `2.2.10` turns Display Help into a screen-ordered control legend with
matching inline SVG icons.

Version `2.2.9` makes Display's map-control buttons use inline SVG icons so
they do not depend on browser font loading.

Version `2.2.8` trims Display Help to Display-owned sailing controls, fixes
Display Settings save verification so the Save button verifies only local
Display alert toggles, and makes popup-alert sound a browser-local Display cue
independent of suite mute.

Version `2.2.7` fixes Display Settings save verification so the Save button
verifies only Display-owned alert settings and no longer checks Audio-owned
output routing.

Version `2.2.6` keeps Display's local popup-alert sound option visible under
Alerts while leaving Audio-owned output routing out of Display.

Version `2.2.5` removes visible sound-output management from Display. Audio
output routing, mute policy, stream controls, and sound checks now belong in
AJRM Marine Audio.

Version `2.2.4` restores the three active-profile sensitivity sliders in Display
and saves them through AJRM Marine Traffic while
keeping the package id and Signal K paths stable for compatibility.

Version `2.2.13` is the sailing display for the AJRM Marine architecture:

- AJRM Marine Traffic owns target safety state, CPA/TCPA, profile selection,
  Auto Profile, Audio Policy, and silence state.
- AJRM Marine Notifications owns alert lifecycle, presentation, priority, and history.
- AJRM Marine Audio owns authoritative playback.
- Display owns chart interaction, rendering, target browsing, browser-local
  visual settings, and Help.

</details>

## Display functionality

- Offline NaturalEarth basemap.
- OpenStreetMap, OpenTopoMap and Satellite basemaps.
- Auto Charts as one overlay selecting the best Signal K provider chart for the
  current position and zoom.
- A visible Cycle chart button and configurable browser-local shortcut for
  choosing among overlapping charts without changing other Display clients.
- OpenSeaMap seamarks.
- Own-vessel follow/recentre with configurable COG look-ahead, plus manual
  chart browsing.
- Evidence-backed Class A/Class B AIS vessel symbols, an explicit unknown-class
  symbol, and base-station, AtoN and special-safety target symbols.
- Browser-local own-vessel icon style, heading/COG direction, colour, and
  50-150% size controls that do not resize target vessels.
- Own-vessel projected track and TCPA guide lines always use COG, independently
  of the icon direction setting.
- Target labels, projected courses, footprints, range rings and CPA overlays.
- Target table, sorting, selection and detailed vessel information.
- Bottom alert panel and optional alert popups.
- Profile selection, profile sensitivity sliders, and target silence controls
  backed by AJRM Marine Traffic.
- Auto Profile status and enable/disable control backed by AJRM Marine Traffic.
- Global mute and stationary automute controls backed by AJRM Marine Traffic Audio Policy.
- Harbour Limits loaded directly from Signal K region resources.
- Display-only Signal K v2 routes with configurable colour and width,
  direction arrows, a reversible route order, and optional filtering to routes
  that cross the current chart area.
- GPX 1.1 import and export compatible with OpenCPN route extensions and with
  Savvy Navvy routes whose name is stored in GPX metadata and whose route
  points are unnamed. The browser can index multiple selected files or a whole
  selected device folder before filtering and opening a route.
- Immediate announcement-feed updates from AJRM Marine Notifications audio delivery,
  deduplicated when the same event later enters history.
- Browser speech follows the provider's explicit audio-delivery flag, queues
  only one fresh utterance at a time, and discards/cancels browser speech while
  the tab or window is in the background so old traffic repeats are not spoken
  in a burst when focus returns.
- Replay indication, display settings, responsive phone/tablet presentation and
  the established Help interface.
- Timestamped voyage observations, with optional structured diagnostic
  Snapshot evidence, when AJRM Marine Capture has an active voyage.

## Deliberately not in Display

- Collision-risk calculation and severity assignment.
- Alert wording or lifecycle ownership.
- Profile threshold editing; this belongs to the AJRM Marine Traffic administration webapp.
- Sound generation; AJRM Marine Audio owns playback.
- AJRM Marine Traffic health/configuration; this belongs to the AJRM Marine Traffic webapp.

## Reduced mode

The Display remains usable without AJRM Marine Traffic. Standard Signal K subscriptions
and API data continue to provide own-vessel navigation, vessel positions,
identity and chart resources. Targets cannot be assigned AJRM Marine Traffic safety
state in that mode and must be treated as unassessed.

If AJRM Marine Notifications or Audio is unavailable, chart and target operation
continues with reduced alert or playback status.

## Configuration

AJRM Marine Display appears in Signal K Plugin Config.

- **Enable AJRM Marine Display**
- **Data refresh interval**
- **Fallback map latitude, longitude and zoom**
- **GPX route directory on the Signal K server** (default
  `~/AJRMMarineRoutes`)

Chart selection, pan, zoom, overlays and display preferences remain
browser-local so map interaction does not wait for server round trips.

## Routes

Use the map's **Route** button to open a GPX file from either the Pi or the
browser device, or to open an existing Signal K v2 route resource. A
browser-selected route may also be saved into the configured Pi directory.
The browser controls the local file chooser, so browsers do not permit the
webapp to reopen or prescribe the previous Mac/PC directory; the chooser will
normally remember it according to that browser's own privacy policy. The Pi
directory is remembered in Signal K plugin configuration.

**Reverse** is a toggle on the displayed route. Saving while reversed writes
the reversed coordinate and waypoint order to both the Signal K resource and
the GPX file. Opening a route only displays it: it does not engage an autopilot
or alter the active Signal K course.

Signal K route names are unique within Display, compared case-insensitively.
**Save As** therefore requires a new name. Reopening a same-named GPX route
updates the existing Signal K resource instead of creating another one. The
Delete button removes the selected Signal K resource only; it does not delete
the corresponding GPX file in the configured Pi directory.

AJRM Marine Capture records the route that was open at voyage start and every
subsequent open, reverse, save or close with voyage elapsed time. Recomputed
replay restores the start route and applies the recorded route changes at the
corresponding source times.

## Install

```bash
cd ~/.signalk
npm install git+https://github.com/ajrm-marine-suite/signalk-ajrm-marine-display.git#v0.7.3 --omit=dev --no-package-lock
sudo systemctl restart signalk
```

Open **Webapps → AJRM Marine Display** and hard-refresh after upgrading.

## Development

```bash
npm install
npm test
```

## Attribution

AJRM Marine Display is authored and maintained by Anthony McDonald, with assistance from William McAusland. The chart interface was extracted from
the AJRM Marine chart work. MIT-licensed third-party or previously extracted components retain their original notices and acknowledgements. It builds on the Signal K project and the work of Signal K
plugin authors.

## License and commercial use

This software is licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later). You may use, study, share, and modify it under that licence. If you modify it and make it available to users over a network, the corresponding source code must also be made available under the AGPL.

Commercial licensing is available by arrangement for organisations that want different terms.

## Safety

> This software is a public beta and must not be relied upon for navigation or
> safety. The skipper remains responsible for navigation, collision avoidance
> and every operational decision. The authors do not accept responsibility for
> loss or damage resulting from its use.


## Public Beta

Chart, traffic, and vessel-status display for the AJRM Marine Suite.

Development assistance: OpenAI Codex helped with code generation, refactoring, and automated testing during the beta development cycle.
