# AJRM Marine Display

Operational chart, target and alert Display for the AJRM Marine suite.

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

## Display functionality

- Offline NaturalEarth basemap.
- OpenStreetMap, OpenTopoMap and Satellite basemaps.
- Auto Charts as one overlay selecting the best Signal K provider chart for the
  current position and zoom.
- OpenSeaMap seamarks.
- Own-vessel follow/recentre and manual chart browsing.
- AIS vessel, base-station, AtoN and special-safety target symbols.
- Target labels, projected courses, footprints, range rings and CPA overlays.
- Target table, sorting, selection and detailed vessel information.
- Bottom alert panel and optional alert popups.
- Profile selection, profile sensitivity sliders, and target silence controls
  backed by AJRM Marine Traffic.
- Auto Profile status and enable/disable control backed by AJRM Marine Traffic.
- Global mute and stationary automute controls backed by AJRM Marine Traffic Audio Policy.
- Harbour Limits loaded directly from Signal K region resources.
- Immediate announcement-feed updates from Notifications Plus audio delivery,
  deduplicated when the same event later enters history.
- Replay indication, display settings, responsive phone/tablet presentation and
  the established Help interface.

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

If Notifications Plus or Audio is unavailable, chart and target operation
continues with reduced alert or playback status.

## Configuration

AJRM Marine Display appears in Signal K Plugin Config.

- **Enable AJRM Marine Display**
- **Data refresh interval**
- **Fallback map latitude, longitude and zoom**

Chart selection, pan, zoom, overlays and display preferences remain
browser-local so map interaction does not wait for server round trips.

## Install

```bash
cd ~/.signalk
npm install git+https://github.com/ajrm-marine-suite/signalk-ajrm-marine-display.git#v0.5.15 --omit=dev --no-package-lock
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

> This software is Alpha Release and has not been tested in live environments
> and must not be relied upon for navigation or safety. The Authors do not accept
> any responsibility for loss or damage as a result of using this software.


## Public Beta

Chart, traffic, and vessel-status display for the AJRM Marine Suite.

Development assistance: OpenAI Codex helped with code generation, refactoring, and automated testing during the beta development cycle.
