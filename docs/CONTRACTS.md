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
- AJRM Marine Logger replay state at
  `vessels.self.plugins.ajrmMarineLogger.playback`.

It also consumes standard Signal K own-navigation, vessel, notification and
chart-resource trees as the interoperability and reduced-mode baseline.

For versioned projections, Display:

- accepts only supported contract major versions;
- resets ordering when `sessionId` changes;
- accepts only increasing `sequence` values within one session;
- ignores unknown additive fields;
- keeps cached target and chart presentation during temporary disconnection;
- labels reduced operation visibly when Traffic Core, Notifications Plus or Audio
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
  "version": "2.0.0",
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

## Ownership

Display may calculate only visual geometry such as course-vector endpoints,
range-ring geometry, viewport fitting and chart selection. It must not
calculate safety state, collision thresholds, notification meaning, priority,
lifecycle, speech eligibility or audio ordering.

Traffic Core commands are invoked only when Traffic Core advertises
`commandsEnabled: true`. Provider-authored actions are rendered without
interpreting notification prose.
