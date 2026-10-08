import { useEffect } from "react";
import type { StudyController } from "../application/StudyController";
export function useKeyboardControls(
  controller: StudyController,
  onPunch: () => void,
  enabled = true,
) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const element = event.target as HTMLElement;
      if (
        element.closest("input,select,textarea,dialog,[role=dialog]") ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      if (event.repeat) return;
      const keys: Record<string, ["attack" | "stance" | "power", -1 | 1]> = {
        a: ["attack", -1],
        d: ["attack", 1],
        j: ["stance", -1],
        l: ["stance", 1],
        arrowleft: ["power", -1],
        arrowright: ["power", 1],
      };
      const key = event.key.toLowerCase();
      if (!enabled && (keys[key] || key === " ")) return;
      if (keys[key]) {
        event.preventDefault();
        const [wheel, delta] = keys[key];
        controller.dispatch({ type: "turn", wheel, delta });
      }
      if (key === " " && !element.closest("button")) {
        event.preventDefault();
        if (controller.state.phase === "ready")
          controller.dispatch({ type: "start" });
        else onPunch();
      }
      if (key === "escape" || key === "p") {
        event.preventDefault();
        if (controller.state.phase === "sparring")
          controller.dispatch({ type: "pause" });
        else if (controller.state.phase === "paused")
          controller.dispatch({ type: "resume" });
      }
    };
    const hidden = () => {
      if (document.hidden) controller.dispatch({ type: "pause" });
    };
    window.addEventListener("keydown", handler);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("keydown", handler);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [controller, onPunch, enabled]);
}
