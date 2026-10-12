import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { X } from "lucide-react";
import { Character } from "./Character";
import { useSurfaceDrag } from "./useSurfaceDrag";
import { displayError, type PresenceSnapshot } from "./types";
export function EdgeSurface() {
  const [presence, setPresence] = useState<PresenceSnapshot>({
    surface: "edge",
    side: "left",
    vertical: 0.5,
    reminder: null,
    latest: null,
    remindersEnabled: true,
  });
  const [error, setError] = useState("");
  const action = (name: string) =>
    void invoke("presence_action", { action: name }).catch((e) =>
      setError(displayError(e)),
    );
  const drag = useSurfaceDrag(
    () => action("chat"),
    (e) => setError(displayError(e)),
  );
  useEffect(() => {
    let cancelled = false;
    let stop: (() => void) | undefined;
    void listen<PresenceSnapshot>("ordibot:presence", (e) =>
      setPresence(e.payload),
    ).then((fn) => {
      if (cancelled) fn();
      else stop = fn;
    });
    void invoke<PresenceSnapshot>("presence_snapshot")
      .then(setPresence)
      .catch((e) => setError(displayError(e)));
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);
  return (
    <div className={`edge-surface dock-${presence.side}`}>
      <button
        className="edge-pet"
        aria-label="展开 OrdiBot Chat"
        title={error || "点击展开 OrdiBot · 拖动停靠"}
        {...drag}
        onClick={(e) => {
          if (e.detail === 0) action("chat");
        }}
      >
        <Character headOnly />
        <span className="edge-ready-dot" />
      </button>
      {presence.reminder && presence.remindersEnabled ? (
        <div className="edge-reminder">
          <button
            className="reminder-content"
            onClick={() =>
              void invoke("context_accept").catch((e) =>
                setError(displayError(e)),
              )
            }
          >
            <strong>正在查看 · {presence.reminder.app}</strong>
            <span>
              {presence.reminder.window || "仅应用元数据 · 未读取内容"}
            </span>
          </button>
          <button
            className="reminder-close"
            aria-label="关闭上下文提醒"
            onClick={() => action("dismiss")}
          >
            <X size={12} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
