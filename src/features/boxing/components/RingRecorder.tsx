import { useEffect, useRef, useState } from "react";

/** Optional local proof capture. The stream contains the actual rendered ring, without microphone audio. */
export function RingRecorder({
  ready,
  seconds = 12,
}: {
  ready: boolean;
  seconds?: number;
}) {
  const [recording, setRecording] = useState(false),
    [clip, setClip] = useState<string | null>(null),
    [error, setError] = useState("");
  const cleanup = useRef<(() => void) | null>(null),
    clipRef = useRef<string | null>(null);
  useEffect(
    () => () => {
      cleanup.current?.();
      if (clipRef.current) URL.revokeObjectURL(clipRef.current);
    },
    [],
  );
  const record = () => {
    const canvas = document.querySelector<HTMLCanvasElement>(
      ".ring-viewport canvas",
    );
    if (
      !canvas ||
      !canvas.captureStream ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Recording is unavailable in this browser.");
      return;
    }
    cleanup.current?.();
    if (clipRef.current) URL.revokeObjectURL(clipRef.current);
    clipRef.current = null;
    setClip(null);
    setError("");
    let stream: MediaStream | null = null,
      recorder: MediaRecorder | null = null;
    try {
      stream = canvas.captureStream(30);
      const mime = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      recorder = new MediaRecorder(
        stream,
        mime ? { mimeType: mime, videoBitsPerSecond: 6000000 } : undefined,
      );
      const chunks: Blob[] = [];
      let cancelled = false;
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        stream?.getTracks().forEach((track) => track.stop());
        if (cancelled) return;
        const url = URL.createObjectURL(
          new Blob(chunks, { type: recorder!.mimeType }),
        );
        clipRef.current = url;
        try {
          if (!import.meta.env.DEV) {
            setClip(url);
            setRecording(false);
            return;
          }
          const blob = new Blob(chunks, { type: recorder!.mimeType });
          const response = await fetch("/__motion-proof", {
            method: "POST",
            headers: { "Content-Type": blob.type },
            body: blob,
          });
          if (!response.ok) throw new Error("Local capture save failed");
          const saved: { url: string } = await response.json();
          if (!cancelled) setClip(saved.url);
        } catch {
          if (!cancelled) {
            setClip(url);
            setError(
              "Local save unavailable; the browser clip is still downloadable.",
            );
          }
        }
        if (!cancelled) setRecording(false);
      };
      recorder.onerror = () => {
        setError("Recording failed. Try again after the ring loads.");
        setRecording(false);
      };
      recorder.start(250);
      setRecording(true);
      const timer = window.setTimeout(() => {
        if (recorder?.state === "recording") recorder.stop();
      }, seconds * 1000);
      cleanup.current = () => {
        cancelled = true;
        window.clearTimeout(timer);
        if (recorder?.state !== "inactive") recorder?.stop();
        stream?.getTracks().forEach((track) => track.stop());
      };
    } catch {
      stream?.getTracks().forEach((track) => track.stop());
      setRecording(false);
      setError("Recording is unavailable in this browser.");
    }
  };
  return (
    <>
      <button disabled={!ready || recording} onClick={record}>
        {recording ? "Recording ring…" : `Record ${seconds}s clip`}
      </button>
      {clip && (
        <a href={clip} download="boxing-motion.webm">
          Download ring clip
        </a>
      )}
      {error && <span role="status">{error}</span>}
    </>
  );
}
