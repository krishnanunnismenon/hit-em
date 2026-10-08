import { useEffect, useState } from "react";
import { FightAudio, type AudioStatus } from "../audio/FightAudio";
import type { AudioMix } from "../audio/mix";
import { GROOVE } from "../audio/score";
import type { OpponentId } from "../domain/opponent";
export function AudioSettings({
  audio,
  status,
  enabled,
  mix,
  onEnable,
  onMix,
  open,
  rival,
}: {
  audio: FightAudio;
  status: AudioStatus;
  enabled: boolean;
  mix: AudioMix;
  onEnable: (enabled: boolean) => void;
  onMix: (mix: AudioMix) => void;
  open: boolean;
  rival: OpponentId;
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const [download, setDownload] = useState<string | null>(null);
  useEffect(() => {
    if (!open) audio.stopPreview();
  }, [audio, open]);
  useEffect(
    () => () => {
      if (download) URL.revokeObjectURL(download);
    },
    [download],
  );
  const check = async () => {
    if (status.previewing) {
      audio.stopPreview();
      return;
    }
    setPending(true);
    setError("");
    try {
      const bytes = await audio.soundCheck();
      setDownload(
        URL.createObjectURL(new Blob([bytes], { type: "audio/wav" })),
      );
    } catch (e) {
      setError(
        e instanceof Error && e.message === "Sound check cancelled."
          ? ""
          : e instanceof Error
            ? e.message
            : "Sound check could not play. Try again.",
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <section className="audio-settings" aria-labelledby="sound-mix-heading">
      <h3 id="sound-mix-heading">Sound mix</h3>
      <label className="setting-row sound-switch">
        <span>
          Sound<small>Original funk, ring sounds and comic mischief.</small>
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnable(e.target.checked)}
        />
      </label>
      <div className="mix-sliders">
        {(
          [
            ["music", "Music"],
            ["effects", "Fight effects"],
            ["ambience", "Ring ambience"],
          ] as const
        ).map(([key, label]) => (
          <label className="mix-level" key={key}>
            <span>
              {label}
              <output>{Math.round(mix[key] * 100)}%</output>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.round(mix[key] * 100)}
              aria-label={`${label} volume`}
              aria-valuetext={`${Math.round(mix[key] * 100)} percent`}
              onChange={(e) => {
                audio.stopPreview();
                setDownload(null);
                onMix({ ...mix, [key]: Number(e.target.value) / 100 });
              }}
            />
          </label>
        ))}
      </div>
      <p className="mix-description">
        {enabled
          ? `${GROOVE[rival]}. Punches cut through the groove.`
          : "Enable sound to hear the ring or try the mix."}
      </p>
      <div className="sound-check-actions">
        <button
          type="button"
          className="sound-check-button"
          disabled={!enabled || pending}
          onClick={() => void check()}
        >
          {pending
            ? "Preparing sound check…"
            : status.previewing
              ? "Stop sound check"
              : "Play sound check"}
        </button>
        {download && (
          <a href={download} download="boxing-basement-funk.wav">
            Save sound check
          </a>
        )}
      </div>
      <p className="audio-status" role="status">
        {error ||
          (!status.available
            ? "Sound could not start. Try switching Sound on again."
            : status.previewing
              ? "12 seconds: groove, punches, guard, birds and a comic fall."
              : "")}
      </p>
    </section>
  );
}
