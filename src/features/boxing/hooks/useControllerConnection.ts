import { useCallback, useEffect, useRef, useState } from "react";
import type { StudyController } from "../application/StudyController";
import type { StudySnapshot } from "../domain/types";
import type { ControllerInput } from "../../../../shared/input";
export function useControllerConnection(
  controller: StudyController,
  state: StudySnapshot,
) {
  const [status, setStatus] = useState({
    connected: false,
    simulated: false,
    message: "Keyboard and pointer ready",
    linked: false,
  });
  const socket = useRef<WebSocket | null>(null),
    epoch = useRef(""),
    sequence = useRef(0),
    enabled = useRef(false),
    active = useRef(true);
  enabled.current =
    !state.knockout && (state.phase === "sparring" || state.phase === "ready");
  const arm = useCallback(() => {
    epoch.current = "";
    sequence.current = 0;
    if (socket.current?.readyState === WebSocket.OPEN)
      socket.current.send(
        JSON.stringify({ type: "arm", enabled: enabled.current }),
      );
  }, []);
  useEffect(() => {
    arm();
  }, [arm, state.phase, state.opponent.id, state.difficulty, !!state.knockout]);
  const disconnect = useCallback(() => {
    const old = socket.current;
    socket.current = null;
    old?.close();
    epoch.current = "";
    sequence.current = 0;
    setStatus({
      connected: false,
      simulated: false,
      message: "Keyboard and pointer ready",
      linked: false,
    });
  }, []);
  const connect = useCallback(async () => {
    disconnect();
    setStatus({
      connected: false,
      simulated: false,
      message: "Looking for the local controller relay…",
      linked: true,
    });
    try {
      const response = await fetch("http://127.0.0.1:3110/session", {
        signal: AbortSignal.timeout(4000),
      });
      if (!response.ok) throw Error();
      const data = await response.json();
      if (!active.current) return;
      const ws = new WebSocket(
        `ws://127.0.0.1:3110/controller?token=${encodeURIComponent(data.token)}`,
      );
      socket.current = ws;
      ws.onopen = arm;
      ws.onmessage = (event) => {
        if (socket.current !== ws) return;
        try {
          const message = JSON.parse(event.data);
          if (
            message.type === "status" &&
            typeof message.connected === "boolean" &&
            typeof message.epoch === "string"
          ) {
            epoch.current = message.epoch;
            sequence.current = 0;
            setStatus({
              connected: message.connected,
              simulated: message.simulated === true,
              message:
                typeof message.message === "string"
                  ? message.message
                  : "Controller status changed",
              linked: true,
            });
            if (!message.connected) controller.dispatch({ type: "pause" });
          }
          if (
            message.type !== "input" ||
            !enabled.current ||
            message.epoch !== epoch.current ||
            !epoch.current ||
            !Number.isSafeInteger(message.seq) ||
            message.seq <= sequence.current ||
            !Number.isFinite(message.at) ||
            Math.abs(Date.now() - message.at) > 250
          )
            return;
          const input = message.input;
          if (!(
            input?.type === "punch" ||
            (input?.type === "turn" &&
              ["attack", "stance", "power"].includes(input.wheel) &&
              [-1, 1].includes(input.delta))
          ))
            return;
          sequence.current = message.seq;
          controller.dispatch(input);
        } catch {
          /* No malformed transport data reaches combat. */
        }
      };
      ws.onclose = () => {
        if (socket.current !== ws) return;
        socket.current = null;
        epoch.current = "";
        controller.dispatch({ type: "pause" });
        setStatus({
          connected: false,
          simulated: false,
          message: "Relay disconnected. Reconnect here, then resume.",
          linked: false,
        });
      };
      ws.onerror = () => ws.close();
    } catch {
      if (active.current)
        setStatus({
          connected: false,
          simulated: false,
          message:
            "Relay unavailable. Start Boxing: Controller relay, then connect again.",
          linked: false,
        });
    }
  }, [arm, controller, disconnect]);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      const ws = socket.current;
      socket.current = null;
      ws?.close();
    };
  }, []);
  const simulate = (input: ControllerInput) => {
    if (status.simulated && socket.current?.readyState === WebSocket.OPEN)
      socket.current.send(JSON.stringify({ type: "simulate", input }));
  };
  return { ...status, connect, disconnect, simulate };
}
