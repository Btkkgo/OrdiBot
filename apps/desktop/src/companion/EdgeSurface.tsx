import {
  appearanceDefaults,
  normalizeAppearance,
  applyAppearance,
  createAppearanceReceiver,
  type Appearance,
} from "./appearance";
import { UiProvider } from "./UiContext";
import { createCompanionTranslator } from "../i18n/companion";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, emit } from "@tauri-apps/api/event";
import { X } from "lucide-react";
import { Character } from "./Character";
import { useSurfaceDrag } from "./useSurfaceDrag";
import { displayError, type PresenceSnapshot, type Snapshot } from "./types";
export function EdgeSurface() {
  const [presence, setPresence] = useState<PresenceSnapshot>({
    surface: "edge",
    side: "left",
    vertical: 0.5,
    reminder: null,
    latest: null,
    remindersEnabled: true,
  });
  const [error, setError] = useState<unknown>("");
  const [appearance, setAppearance] = useState<Appearance>(appearanceDefaults);
  const t = createCompanionTranslator(appearance.language);
  useEffect(() => applyAppearance(appearance), [appearance]);
  useEffect(() => {
    let disposed = false;
    const stops: (() => void)[] = [];
    const retain = (fn: () => void) => (disposed ? fn() : stops.push(fn));
    const receiver = createAppearanceReceiver((p) => {
      if (!disposed) setAppearance(p);
    });
    void Promise.all([
      listen<Appearance>("ordibot:appearance-preview", (e) =>
        receiver.event(e.payload),
      ),
      listen<Appearance>("ordibot:config", (e) => receiver.event(e.payload)),
    ])
      .then((listeners) => {
        listeners.forEach(retain);
        if (disposed) return;
        const checkpoint = receiver.checkpoint();
        void invoke<Snapshot>("companion_snapshot")
          .then((s) => receiver.snapshot(s.data.config, checkpoint))
          .catch(setError);
        void emit("ordibot:appearance-request");
      })
      .catch(setError);
    return () => {
      disposed = true;
      stops.forEach((fn) => fn());
    };
  }, []);
  const action = (name: string) =>
    void invoke("presence_action", { action: name }).catch((e) => setError(e));
  const drag = useSurfaceDrag(
    () => action("chat"),
    (e) => setError(e),
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
      .catch((e) => setError(e));
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);
  return (
    <UiProvider appearance={appearance}>
      <div className={`edge-surface dock-${presence.side}`}>
        <button
          className="edge-pet"
          aria-label={t("edgeOpen")}
          title={
            error ? displayError(error, appearance.language) : t("edgeHelp")
          }
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
                void invoke("context_accept").catch((e) => setError(e))
              }
            >
              <strong>
                {t("edgeViewing", { app: presence.reminder.app })}
              </strong>
              <span>{presence.reminder.window || t("edgeMetadata")}</span>
            </button>
            <button
              className="reminder-close"
              aria-label={t("dismissReminder")}
              onClick={() => action("dismiss")}
            >
              <X size={12} />
            </button>
          </div>
        ) : null}
      </div>
    </UiProvider>
  );
}
