import { useEffect, useRef, useState } from "react";
import type { BoxingScene, SceneStats } from "../scene/BoxingScene";
import type { StudyController } from "../application/StudyController";
interface Props {
  controller: StudyController;
  reduced: boolean;
  onReady: (ready: boolean) => void;
  onStats: (stats: SceneStats) => void;
  onContact: (x: number, y: number) => void;
}
export function RingViewport({
  controller,
  reduced,
  onReady,
  onStats,
  onContact,
}: Props) {
  const host = useRef<HTMLDivElement>(null),
    scene = useRef<BoxingScene | null>(null),
    motion = useRef(reduced);
  const [error, setError] = useState(false);
  useEffect(() => {
    motion.current = reduced;
    scene.current?.setReduced(reduced);
  }, [reduced]);
  useEffect(() => {
    let cancelled = false,
      current: BoxingScene | null = null;
    onReady(false);
    void (async () => {
      try {
        const { BoxingScene } = await import("../scene/BoxingScene");
        if (cancelled) return;
        current = new BoxingScene(
          host.current!,
          controller,
          motion.current,
          onStats,
          onContact,
        );
        scene.current = current;
        await current.prepare("/textures/arena-concrete.webp");
        if (cancelled) return;
        current.start();
        onReady(true);
      } catch (reason) {
        current?.dispose();
        if (!cancelled) {
          setError(true);
          onReady(false);
          console.error("Boxing renderer could not start", reason);
        }
      }
    })();
    return () => {
      cancelled = true;
      current?.dispose();
      scene.current = null;
    };
  }, [controller, onReady, onStats, onContact]);
  return (
    <div className="ring-viewport" ref={host}>
      {error && (
        <div className="renderer-error" role="alert">
          <h2>The ring could not load.</h2>
          <p>
            Check your connection and browser hardware acceleration, then reload
            to try again.
          </p>
          <button onClick={() => location.reload()}>Reload ring</button>
        </div>
      )}
    </div>
  );
}
