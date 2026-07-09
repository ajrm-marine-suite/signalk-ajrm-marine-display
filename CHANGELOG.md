# Changelog

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
