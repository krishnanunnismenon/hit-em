# Basement funk and comic ring sound — 2026-10-08

The user selected bass, drums and playful brass. The game now has an original procedural score, contact sounds, foot scuffs, room tone, crowd accents and six comic knockout signatures. Everything is synthesized locally using native Web Audio; no music service, network request, third-party sample or extra dependency is needed.

## Listen and mix

Open Your corner, enable Sound, and choose Play sound check. It renders a 12-second example with the current mix: funk groove, four punches, counter, guard, missed swing, stunned birds, a banana-peel fall and victory brass. Save sound check exports a stereo WAV. Volume changes stop the preview and clear its export so the next check reflects the new levels.

Music, Fight effects and Ring ambience have independent saved levels, initially 42%, 85% and 24%. Sound stays optional and preserves the existing sound-off default. A pointer or keyboard gesture unlocks browser audio; hardware messages alone cannot satisfy browser autoplay rules. If a stored preference enables sound after reload, tap the speaker once before using the physical controller.

## Score

| Rival | Groove | Tempo | Character |
| --- | --- | --- | --- |
| Pip | Pip’s two-step | 110 BPM | Syncopated bass, nimble horn replies, ghost snare |
| Bram | Bram’s basement stomp | 94 BPM | Lower brass, heavier kick and grounded bass |
| Juno | Juno’s crooked encore | 122 BPM | Quicker chromatic answers and cheekier fills |

The eight-bar D-minor/blues progression uses Dm9, G9, F6 and A7(b9), with authored bass lines, short keys, alternate-bar brass answers and turnaround percussion. Corner/result arrangements are sparse; the fight brings drums forward; Super adds brightness and activity; knockout clears space for the fall. Low health lifts intensity. Impact ducking leaves punches legible, and victory/loss use different musical tags. The music has intentional recurring motifs, rather than claiming an endless non-repeating composition.

## Ring vocabulary

| Event | Sound |
| --- | --- |
| Jab / Cross / Hook / Uppercut | Distinct air paths and contact palettes; weight follows accepted power |
| Block / Perfect Guard | Padded knock / precise bright bell |
| Miss | Air swish and descending slide, without a contact thump |
| Counter / Super | Bell accent / ascending sparkle |
| Stun, on either fighter | Spring wobble and alternating pitched canary chirps |
| Supported spacing step | Light mat scuff at the authoritative step completion |
| Timber / Jelly knees | Falling whistle / three spring wobbles |
| Pirouette / Banana peel | Ascending key spiral / slipping swish and slide |
| Victory too soon / Encore | False brass fanfare / spring and deflated slide |
| Actual fall landing | Mat thump only when the engine emits fall-impact, including Encore’s second landing |

Short room reverb and gentle stereo placement make the underground ring feel close. Sparse claps/whistles have a cooldown, and ambient noise stays behind the combat cues. Feints and ordinary notices do not invent contact sounds.

## Implementation and ownership

`audio/score.ts` and `cues.ts` are pure cue builders. `FightAudio` receives state snapshots and engine events without issuing commands, drawing combat randomness or changing damage. Event IDs suppress duplicates and reset between encounters. One gesture-created AudioContext owns a renderer, three layer buses, an impact duck bus, cached noise/wavetables, a short shared reverb, compression and a bounded saturation stage.

A 25 ms lookahead scheduler uses the audio clock and skips stale notes after stalls. At most 48 primary voices overlap; short-lived nodes disconnect on end, and disposing closes the context and releases the shared graph. Effects follow engine contacts, not animation callbacks. Music continues through brief impact hit-stop to preserve its groove, but explicit pause, mute and hidden-page state stop scheduling and suspend playback. Preview cancellation is generation-guarded, including mute/background/changed-mix/unmount cases. Reduced motion keeps the same informative sound vocabulary.

`preview.ts` uses the same renderer in OfflineAudioContext and exports bounded 16-bit stereo PCM. It does not feed back into gameplay. No firmware, serial protocol, physical pin or sibling Signal Lock changes are part of this milestone.

## Verification and limits

114 tests pass, including eight audio tests; the production build and formatting check pass. A real browser rendered the exported preview: 48 kHz stereo, exactly 12 seconds, peak -4.19 dBFS, RMS -24.83 dBFS, zero clipped samples. Desktop and 390×844 mobile sound controls were inspected; the three sliders have 44 px interaction height and work from the keyboard. Reload retained mix/preferences, live entry/punch/pause/mute produced no console errors or warnings, and changing levels removed the stale export.

These checks establish scheduling, lifecycle, data integrity and UI behavior. They do not replace the user's listening review or measure audio performance on a physical phone. Instrument, crowd and room timbres are synthesized rather than recordings. The existing Three.js build-size advisory remains unrelated to this audio work.

Evidence: `.impeccable/review/audio-manifest.json`, `audio-desktop.png`, `audio-mobile.png` and `boxing-basement-funk.wav`.
