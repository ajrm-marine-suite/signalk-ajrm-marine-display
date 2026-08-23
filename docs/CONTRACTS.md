# AJRM Marine Display contracts

This document is the public AJRM Marine Display contract baseline.

## Inputs

Display consumes these versioned projections:

- `ajrm-marine-traffic-capabilities` at
  `vessels.self.plugins.ajrmMarineTraffic.capabilities`;
- `ajrm-marine-traffic-targets` at
  `vessels.self.plugins.ajrmMarineTraffic.targets`;
- `notifications-plus-projection` at
  `vessels.self.plugins.ajrmMarineNotifications`;
- AJRM Marine Audio runtime status at
  `vessels.self.plugins.ajrmMarineAudio`;
- AJRM Marine Capture replay state at
  `vessels.self.plugins.ajrmMarineCapture.playback`.

It also consumes standard Signal K own-navigation, vessel, notification and
chart-resource trees as the interoperability and reduced-mode baseline.

## Startup position and environmental context

Display does not expose the initially configured chart centre while resolving
the own-vessel position. The first valid coordinate is classified explicitly
as either `fresh` or `last-known`; `isStale` and `isLost` retained self targets
remain last-known even though their coordinates are usable. The startup gate
is registered before the tide/weather controller, so it centres the chart
before automatic environmental requests can start.

Automatic tide and nearest-weather requests may use either resolved position
class, but never use the displayed chart centre. Weather distance text says
`Distance from last known position` when appropriate, and cached-weather text
uses the same qualification. Last-known positions are not used to request
anchoring suggestions.

For versioned projections, Display:

- accepts only supported contract major versions;
- resets ordering when `sessionId` changes;
- accepts only increasing `sequence` values within one session;
- ignores unknown additive fields;
- keeps cached target and chart presentation during temporary disconnection;
- labels reduced operation visibly when AJRM Marine Traffic, AJRM Marine Notifications or Audio
  projections are unavailable.

## Display status

The Display plugin publishes:

`vessels.self.plugins.ajrmMarineDisplay`

```json
{
  "contract": "ajrm-marine-display-status",
  "contractVersion": 1,
  "sessionId": "uuid",
  "sequence": 1,
  "enabled": true,
  "version": "0.7.0",
  "defaults": {
    "refreshIntervalMs": 1000,
    "latitude": 56.45,
    "longitude": -5.45,
    "zoom": 10
  },
  "updatedAt": "2026-06-20T00:00:00.000Z"
}
```

If this status is unavailable, the web app defaults to enabled so that it can
still operate as a generic Signal K display.

On plugin stop, Display publishes `null` at this path and removes its
in-process API. Clients must not treat a previously cached status object as
evidence that Display is still running.

## Ownership

Display may calculate only visual geometry such as course-vector endpoints,
range-ring geometry, viewport fitting and chart selection. It must not
calculate safety state, collision thresholds, notification meaning, priority,
lifecycle, speech eligibility or audio ordering.

AJRM Marine Traffic commands are invoked only when AJRM Marine Traffic advertises
`commandsEnabled: true`. Provider-authored actions are rendered without
interpreting notification prose.

Every HTTP mutation requires an authenticated Signal K principal with
`readwrite` or `admin` permission. Read routes remain available to normal
Signal K webapp clients. The plugin OpenAPI document is the route inventory.

AJRM Marine Vessel Database is deliberately not merged into Traffic. It owns
durable vessel identity and classification; Traffic owns live observations,
encounters and collision-risk state.
