import { useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import { gsap } from "gsap";
import type { StudyEvent } from "../domain/types";
export const ImpactWord = forwardRef<
  HTMLDivElement,
  { event: StudyEvent | null; reduced: boolean }
>(function ImpactWord({ event, reduced }, ref) {
  const local = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => local.current!, []);
  useEffect(() => {
    if (!local.current || !event || event.type === "strike") return;
    const context = gsap.context(() => {
      gsap.fromTo(
        local.current,
        { autoAlpha: 0, scale: reduced ? 1 : 0.72, rotation: reduced ? 0 : -8 },
        {
          autoAlpha: 1,
          scale: 1,
          rotation: reduced ? 0 : -4,
          duration: 0.12,
          ease: "power3.out",
        },
      );
      gsap.to(local.current, { autoAlpha: 0, duration: 0.2, delay: 0.65 });
    }, local);
    return () => context.revert();
  }, [event?.id, reduced]);
  return (
    <div
      ref={local}
      className={
        "impact-word " +
        (event?.outcome === "block" ||
        event?.outcome === "whiff" ||
        event?.type === "notice"
          ? "quiet"
          : "")
      }
      aria-hidden="true"
    >
      <svg className="impact-burst" viewBox="0 0 240 130" aria-hidden="true">
        <path d="M6 84 42 64 12 29 68 42 77 5 111 37 143 3 151 39 211 13 195 54 235 70 200 88 225 120 166 103 135 128 111 105 72 129 65 98 14 112 33 89Z" />
      </svg>
      <span>{event?.text}</span>
      {event?.type === "impact" && event.reason && (
        <small>{event.reason}</small>
      )}
    </div>
  );
});
