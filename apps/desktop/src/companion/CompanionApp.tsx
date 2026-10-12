import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { invoke, Channel, isTauri } from "@tauri-apps/api/core";
import { listen, emit } from "@tauri-apps/api/event";
import {
  MessageCircle,
  ScanText,
  Sparkles,
  History,
  SlidersHorizontal,
  Settings2,
  Minus,
  ArrowUp,
  Plus,
  Clipboard,
  ImagePlus,
  X,
  Square,
  ChevronDown,
  Pin,
  RotateCcw,
  Monitor,
  Check,
  RefreshCw,
} from "lucide-react";
import { useSurfaceDrag } from "./useSurfaceDrag";
import {
  applyAppearance,
  normalizeAppearance,
  type Appearance,
} from "./appearance";
import { UiProvider } from "./UiContext";
import { createCompanionTranslator, taskStatusLabel } from "../i18n/companion";
import { Character } from "./Character";
import { ModelSettings } from "./ModelSettings";
import { AgentWorkspace } from "./AgentWorkspace";
import {
  defaultConfig,
  displayError,
  terminalTask,
  visibleMessage,
  type Page,
  type Snapshot,
  type Conversation,
  type RemoteTask,
  type Attachment,
  type DesktopContext,
  type PresenceSnapshot,
} from "./types";
const nav = [
  { id: "chat", label: "nav.chat", Icon: MessageCircle },
  { id: "context", label: "nav.context", Icon: ScanText },
  { id: "agent", label: "nav.agent", Icon: Sparkles },
  { id: "history", label: "nav.history", Icon: History },
  { id: "models", label: "nav.models", Icon: SlidersHorizontal },
  { id: "settings", label: "nav.settings", Icon: Settings2 },
] as const;
const initial: Snapshot = {
  data: { config: defaultConfig, conversations: [], tasks: [] },
  keyPresent: false,
  remoteKeyPresent: false,
};
export function CompanionApp() {
  const [snapshot, setSnapshot] = useState<Snapshot>(initial);
  const [page, setPage] = useState<Page>("chat");
  const [input, setInput] = useState(() => {
    try {
      return localStorage.getItem("ordibot.chatDraft") ?? "";
    } catch {
      return "";
    }
  });
  const [error, setError] = useState<unknown>("");
  const [appearanceDraft, setAppearanceDraft] = useState<Appearance | null>(
    null,
  );
  const appearance =
    appearanceDraft ?? normalizeAppearance(snapshot.data.config);
  const t = createCompanionTranslator(appearance.language);
  const currentAppearance = useRef(appearance);
  currentAppearance.current = appearance;
  useEffect(() => {
    if (!isTauri()) return;
    let disposed = false;
    let stop: (() => void) | undefined;
    void listen("ordibot:appearance-request", () => {
      void emit("ordibot:appearance-preview", currentAppearance.current);
    }).then((fn) => {
      if (disposed) fn();
      else stop = fn;
    });
    return () => {
      disposed = true;
      stop?.();
    };
  }, []);
  useEffect(() => {
    applyAppearance(appearance);
    if (isTauri()) {
      void emit("ordibot:appearance-preview", appearance);
      void invoke("preview_ui_language", {
        language: appearance.language,
      }).catch(setError);
    }
  }, [
    appearance.language,
    appearance.fontScale,
    appearance.accentColor,
    appearance.backgroundStyle,
  ]);
  const [busy, setBusy] = useState(false);
  const [contextBusy, setContextBusy] = useState(false);
  const [conversation, setConversation] = useState<Conversation>();
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [preview, setPreview] = useState("");
  const [context, setContext] = useState<DesktopContext>();
  const [attachedContext, setAttachedContext] = useState<DesktopContext>();
  const [focusContextInput, setFocusContextInput] = useState(false);
  const [reminder, setReminder] = useState<DesktopContext | null>(null);
  const drag = useSurfaceDrag(undefined, (e) => setError(e));
  const [taskId, setTaskId] = useState<string>();
  const [newTask, setNewTask] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryText, setRetryText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const running = useRef(false);
  const pollBusy = useRef(false);
  const refresh = useCallback(async () => {
    const s = await invoke<Snapshot>("companion_snapshot");
    setSnapshot(s);
    return s;
  }, []);
  const operation = async <T,>(
    fn: () => Promise<T>,
  ): Promise<T | undefined> => {
    setError("");
    try {
      return await fn();
    } catch (e) {
      setError(e);
      return undefined;
    }
  };
  const navigate = useCallback(async (next: Page) => {
    try {
      await invoke("window_action", {
        action: next === "agent" ? "agent" : "chat",
      });
      setPage(next);
    } catch (e) {
      setError(e);
    }
  }, []);
  useEffect(() => {
    let disposed = false;
    let stop: (() => void) | undefined;
    void refresh()
      .then((s) => {
        if (!disposed) setConversation(s.data.conversations[0]);
      })
      .catch((e) => {
        if (!disposed) setError(isTauri() ? e : "LOCAL_NATIVE_REQUIRED");
      })
      .finally(() => {
        if (!disposed) setLoading(false);
      });
    if (isTauri())
      void listen<string>("ordibot:navigate", (e) => {
        void navigate(e.payload as Page);
      }).then((fn) => {
        if (disposed) fn();
        else stop = fn;
      });
    return () => {
      disposed = true;
      stop?.();
    };
  }, [refresh, navigate]);
  useEffect(() => {
    if (!isTauri()) return;
    let cancelled = false;
    const stops: (() => void)[] = [];
    const retain = (fn: () => void) => {
      if (cancelled) fn();
      else stops.push(fn);
    };
    void listen<PresenceSnapshot>("ordibot:presence", (e) => {
      const p = e.payload;
      setReminder(p.remindersEnabled ? p.reminder : null);
      if (p.latest) setContext(p.latest);
      setSnapshot((s) =>
        s.data.config.edgeSide === p.side &&
        s.data.config.edgeVertical === p.vertical
          ? s
          : {
              ...s,
              data: {
                ...s.data,
                config: {
                  ...s.data.config,
                  edgeSide: p.side,
                  edgeVertical: p.vertical,
                },
              },
            },
      );
    }).then(retain);
    void listen<DesktopContext>("ordibot:context-accepted", (e) => {
      setContext(e.payload);
      setAttachedContext(e.payload);
      setFocusContextInput(true);
      setAttachments((a) => [
        ...a.filter((v) => v.kind !== "app"),
        {
          kind: "app",
          content: `Layer A: foreground metadata only; page/code/document content was NOT acquired.\n${e.payload.app}\n${e.payload.window}\nCaptured: ${e.payload.capturedAt}`,
        },
      ]);
      setReminder(null);
    }).then(retain);
    return () => {
      cancelled = true;
      stops.forEach((fn) => fn());
    };
  }, []);
  useEffect(() => {
    if (focusContextInput && page === "chat" && !busy) {
      inputRef.current?.focus({ preventScroll: true });
      setFocusContextInput(false);
    }
  }, [focusContextInput, page, busy]);
  useEffect(() => {
    try {
      localStorage.setItem("ordibot.chatDraft", input);
    } catch {
      /* In-memory draft remains available. */
    }
  }, [input]);
  useEffect(
    () => bottom.current?.scrollIntoView({ behavior: "smooth" }),
    [conversation?.messages, draft],
  );
  const task = newTask
    ? undefined
    : (snapshot.data.tasks.find((t) => t.id === taskId) ??
      snapshot.data.tasks[0]);
  useEffect(() => {
    if (page !== "agent" || !task?.sessionId || terminalTask(task.status))
      return;
    const id = task.id;
    let disposed = false;
    const timer = setInterval(() => {
      if (pollBusy.current) return;
      pollBusy.current = true;
      void invoke<RemoteTask>("remote_refresh", { taskId: id })
        .then((t) => {
          if (!disposed)
            setSnapshot((s) => ({
              ...s,
              data: {
                ...s.data,
                tasks: s.data.tasks.map((old) => (old.id === t.id ? t : old)),
              },
            }));
        })
        .catch((e) => {
          if (!disposed) setError(e);
        })
        .finally(() => {
          pollBusy.current = false;
        });
    }, 4000);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [page, task?.id, task?.sessionId, task?.status]);
  const attach = async (
    kind: "clipboard" | "screen" | "app",
    region = false,
  ) => {
    if (contextBusy || busy) return;
    setContextBusy(true);
    try {
      const value = await operation(async () => {
        if (kind === "clipboard") return invoke<string>("attach_clipboard");
        if (kind === "screen")
          return invoke<string>("capture_screen", { region });
        const c = await invoke<DesktopContext>("desktop_context");
        setContext(c);
        if (!c.available) throw "CONTEXT_UNAVAILABLE";
        setAttachedContext(c);
        return `${c.app}\n${c.window}\nCaptured: ${c.capturedAt}`;
      });
      if (value) {
        if (kind === "screen") setPreview(value);
        else
          setAttachments((a) => [
            ...a.filter((v) => v.kind !== kind),
            { kind, content: value },
          ]);
      }
    } finally {
      setContextBusy(false);
    }
  };
  const send = async (text = input) => {
    if (running.current || !text.trim()) return;
    running.current = true;
    setBusy(true);
    setDraft("");
    setError("");
    setRetryText("");
    const previous = conversation;
    let turnConversationId = previous?.id;
    const local: Conversation = previous ?? {
      id: "",
      title: text,
      messages: [],
    };
    setConversation({
      ...local,
      messages: [
        ...local.messages,
        { role: "user", content: text, createdAt: new Date().toISOString() },
      ],
    });
    setInput("");
    const channel = new Channel<{
      kind: string;
      text: string;
      conversationId: string;
    }>();
    channel.onmessage = (e) => {
      if (e.kind === "started") {
        turnConversationId = e.conversationId;
        setConversation((c) => (c ? { ...c, id: e.conversationId } : c));
      }
      if (e.kind === "delta") setDraft((s) => s + e.text);
    };
    try {
      const c = await invoke<Conversation>("chat_send", {
        conversationId: previous?.id || null,
        text,
        attachments,
        onEvent: channel,
      });
      setConversation(c);
      setAttachments([]);
      await refresh();
    } catch (e) {
      setError(e);
      setRetryText(text);
      try {
        const s = await refresh();
        const persisted = s.data.conversations.find(
          (c) => c.id === turnConversationId,
        );
        if (persisted) setConversation(persisted);
        else setConversation(previous);
      } catch {
        /* Keep the local UI if native persistence is unavailable. */
      }
      setInput(text);
    } finally {
      running.current = false;
      setBusy(false);
      setDraft("");
    }
  };
  const updateTask = (t: RemoteTask) => {
    setSnapshot((s) => ({
      ...s,
      data: {
        ...s.data,
        tasks: [t, ...s.data.tasks.filter((old) => old.id !== t.id)],
      },
    }));
    setTaskId(t.id);
    setNewTask(false);
  };
  const startNew = () => {
    if (busy) return;
    setConversation(undefined);
    setInput("");
    setDraft("");
    setAttachments([]);
    setError("");
    void navigate("chat");
  };
  return (
    <UiProvider appearance={appearance}>
      <div
        className={`companion-container dock-${snapshot.data.config.edgeSide} ${page === "agent" ? "agent-mode" : ""}`}
        style={
          {
            "--dock-vertical": snapshot.data.config.edgeVertical,
          } as CSSProperties
        }
      >
        {page !== "agent" ? (
          <aside className="character-zone" {...drag}>
            <Character />
          </aside>
        ) : null}
        <div className="companion-window">
          {page === "agent" ? (
            <div className="agent-titlebar" {...drag}>
              <span className="traffic-lights">
                <i />
                <i />
                <i />
              </span>
              <span>OrdiBot</span>
              <div className="titlebar-right">
                <span className="connected-label">
                  <span className="tiny-dot" />
                  {snapshot.remoteKeyPresent
                    ? t("providerConfigured")
                    : t("providerUnconfigured")}
                </span>
                <button
                  title={t("collapse")}
                  onClick={() =>
                    void operation(() =>
                      invoke("window_action", { action: "edge" }),
                    )
                  }
                >
                  <Minus size={16} />
                </button>
              </div>
            </div>
          ) : null}
          <div className="window-body">
            <nav className="nav-rail" aria-label={t("mainNav")}>
              <div className="rail-top">
                {nav.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    className={page === id ? "active" : ""}
                    title={t(label)}
                    aria-label={t(label)}
                    onClick={() => void navigate(id)}
                  >
                    <Icon size={19} strokeWidth={1.65} />
                  </button>
                ))}
              </div>
              <button
                className="rail-new"
                title={t(page === "agent" ? "newTask" : "newChat")}
                aria-label={t("newChat")}
                disabled={busy}
                onClick={() => {
                  if (page === "agent") {
                    setNewTask(true);
                    setTaskId(undefined);
                  } else startNew();
                }}
              >
                <Plus size={19} />
              </button>
              <div className="rail-logo" title="OrdiBot">
                o<span>•</span>
              </div>
            </nav>
            <main
              className={`main-content ${page === "agent" ? "agent-content" : ""}`}
            >
              {page !== "agent" ? (
                <header className="chat-header" {...drag}>
                  <button
                    className="current-model"
                    onClick={() => void navigate("models")}
                  >
                    <span
                      className={`tiny-dot ${snapshot.keyPresent ? "ready" : ""}`}
                    />
                    <span>
                      {snapshot.data.config.model || t("chooseModel")}
                    </span>
                    <ChevronDown size={12} />
                  </button>
                  <div className="window-controls">
                    {snapshot.data.config.alwaysOnTop ? (
                      <Pin size={12} className="pin-indicator" />
                    ) : null}
                    <button
                      title={t("collapseHelp")}
                      aria-label={t("collapse")}
                      onClick={() =>
                        void operation(() =>
                          invoke("window_action", { action: "edge" }),
                        )
                      }
                    >
                      <Minus size={17} />
                    </button>
                  </div>
                </header>
              ) : null}
              {reminder && page !== "agent" ? (
                <button
                  className="context-reminder-toast"
                  onClick={() => void operation(() => invoke("context_accept"))}
                >
                  <Monitor size={14} />
                  <span>
                    {t("viewing", { app: reminder.app })}
                    {reminder.window ? ` · ${reminder.window}` : ""}
                  </span>
                  <span className="muted">{t("attachMetadata")}</span>
                </button>
              ) : null}
              {error ? (
                <div className="inline-error" role="alert">
                  <span>{displayError(error, appearance.language)}</span>
                  <button
                    aria-label={t("dismiss")}
                    onClick={() => setError("")}
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : null}
              {page === "models" || page === "settings" ? (
                <ModelSettings
                  page={page}
                  snapshot={snapshot}
                  appearance={appearance}
                  onPreview={(next) =>
                    setAppearanceDraft(normalizeAppearance(next))
                  }
                  onSave={async (config, key, remoteKey) => {
                    setError("");
                    try {
                      await invoke("save_companion_config", {
                        config,
                        apiKey: key || null,
                        remoteApiKey: remoteKey || null,
                      });
                      await refresh();
                      setAppearanceDraft(null);
                    } catch (e) {
                      setError(e);
                      throw e;
                    }
                  }}
                />
              ) : page === "agent" ? (
                <AgentWorkspace
                  snapshot={snapshot}
                  task={task}
                  onSubmit={async (objective) => {
                    const t = await operation(() =>
                      invoke<RemoteTask>("remote_submit", { objective }),
                    );
                    if (t) updateTask(t);
                  }}
                  onRefresh={async () => {
                    if (task) {
                      const t = await operation(() =>
                        invoke<RemoteTask>("remote_refresh", {
                          taskId: task.id,
                        }),
                      );
                      if (t) updateTask(t);
                    }
                  }}
                  onControl={async (action, requestId) => {
                    if (task) {
                      const t = await operation(() =>
                        invoke<RemoteTask>("remote_control", {
                          taskId: task.id,
                          action,
                          requestId: requestId ?? null,
                        }),
                      );
                      if (t) updateTask(t);
                    }
                  }}
                  onNavigate={(p) => void navigate(p)}
                  onSelect={(id) => {
                    setTaskId(id);
                    setNewTask(false);
                  }}
                  onOpen={(service) =>
                    void operation(() => invoke("open_service", { service }))
                  }
                />
              ) : page === "history" ? (
                <div className="history-view">
                  <div className="eyebrow">{t("historyKicker")}</div>
                  <h1>{t("historyTitle")}</h1>
                  <button
                    className="outline"
                    disabled={busy}
                    onClick={startNew}
                  >
                    <Plus size={15} /> {t("newChat")}
                  </button>
                  <h2>Chat</h2>
                  {snapshot.data.conversations.length === 0 ? (
                    <p className="muted">{t("noConversations")}</p>
                  ) : (
                    snapshot.data.conversations.map((c) => (
                      <button
                        className="history-item"
                        disabled={busy}
                        key={c.id}
                        onClick={() => {
                          setConversation(c);
                          void navigate("chat");
                        }}
                      >
                        <MessageCircle size={17} />
                        <span>{c.title}</span>
                        <small>
                          {t("messageCount", { count: c.messages.length })}
                        </small>
                      </button>
                    ))
                  )}
                  <h2>{t("remoteAgent")}</h2>
                  {snapshot.data.tasks.length === 0 ? (
                    <p className="muted">{t("noTasks")}</p>
                  ) : (
                    snapshot.data.tasks.map((t) => (
                      <button
                        className="history-item"
                        key={t.id}
                        onClick={() => {
                          setTaskId(t.id);
                          setNewTask(false);
                          void navigate("agent");
                        }}
                      >
                        <Sparkles size={17} />
                        <span>{t.objective}</span>
                        <small>
                          {taskStatusLabel(t.status, appearance.language)}
                        </small>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <>
                  <div className="context-status">
                    <span className="tiny-dot" />
                    {context?.available
                      ? `${context.app}${context.window ? " · " + context.window : ""} · ${t("metadataOnly")}`
                      : t("noContent")}
                    <button
                      title={t("refreshContextHelp")}
                      aria-label={t("refreshContext")}
                      disabled={contextBusy || busy}
                      onClick={() => void attach("app")}
                    >
                      <RefreshCw size={12} />
                    </button>
                  </div>
                  <div className="chat-scroll">
                    {page === "context" ? (
                      <div className="context-panel">
                        <div className="eyebrow">{t("nav.context")}</div>
                        <h2>{t("contextTitle")}</h2>
                        <p>{t("contextIntro")}</p>
                        <button
                          disabled={contextBusy || busy}
                          onClick={() => void attach("clipboard")}
                        >
                          <Clipboard size={16} />
                          <span>
                            {t("selection")}
                            <small>{t("selectionHelp")}</small>
                          </span>
                        </button>
                        <button
                          disabled={contextBusy || busy}
                          onClick={() => void attach("screen")}
                        >
                          <ImagePlus size={16} />
                          <span>
                            {t("screen")}
                            <small>{t("screenHelp")}</small>
                          </span>
                        </button>
                        <button
                          disabled={contextBusy || busy}
                          onClick={() => void attach("screen", true)}
                        >
                          <ImagePlus size={16} />
                          <span>
                            {t("region")}
                            <small>{t("regionHelp")}</small>
                          </span>
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => {
                            setAttachments([]);
                            void navigate("chat");
                          }}
                        >
                          <MessageCircle size={16} />
                          <span>
                            {t("normalChat")}
                            <small>{t("normalChatHelp")}</small>
                          </span>
                        </button>
                      </div>
                    ) : null}
                    {!conversation?.messages.length ? (
                      <div className="welcome">
                        <span className="welcome-kicker">
                          {t("welcomeKicker")}
                        </span>
                        <h1>{t("welcomeTitle")}</h1>
                        <p>{t("welcomeIntro")}</p>
                        <div className="welcome-actions">
                          <button
                            disabled={contextBusy}
                            onClick={() => void attach("clipboard")}
                          >
                            <Clipboard size={14} /> {t("selectedText")}
                          </button>
                          <button
                            disabled={contextBusy}
                            onClick={() => void attach("screen")}
                          >
                            <ImagePlus size={14} /> {t("askScreenshot")}
                          </button>
                        </div>
                        {!snapshot.data.config.model ? (
                          <button
                            className="configure-hint"
                            onClick={() => void navigate("models")}
                          >
                            {t("connectModel")} <ChevronDown size={12} />
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      conversation.messages.map((m, index) => (
                        <article
                          className={`chat-message ${m.role}`}
                          key={`${conversation.id}-${index}`}
                        >
                          <div className="message-content">
                            {visibleMessage(m.content)}
                          </div>
                          {m.content.includes(
                            "<user_attached_clipboard_text>",
                          ) ? (
                            <span className="message-context">
                              <Clipboard size={11} /> {t("textAttached")}
                            </span>
                          ) : null}
                          {m.content.includes("[User-confirmed screenshot") ? (
                            <span className="message-context">
                              <ImagePlus size={11} /> {t("screenAttached")}
                            </span>
                          ) : null}
                        </article>
                      ))
                    )}
                    {busy ? (
                      <article className="chat-message assistant generating">
                        <div className="message-content">
                          {draft || (
                            <span className="typing-dots">
                              <i />
                              <i />
                              <i />
                            </span>
                          )}
                        </div>
                        <button
                          title={t("cancelGeneration")}
                          onClick={() =>
                            void operation(() => invoke("chat_cancel"))
                          }
                        >
                          <Square size={12} /> {t("cancel")}
                        </button>
                      </article>
                    ) : null}
                    <div ref={bottom} />
                  </div>
                  <div className="chat-bottom">
                    {attachedContext &&
                    attachments.some((a) => a.kind === "app") &&
                    !attachments.some((a) => a.kind !== "app") ? (
                      <div className="attached-context-guide">
                        <strong>
                          {t("acceptedContext", { app: attachedContext.app })}
                          {attachedContext.window
                            ? ` · ${attachedContext.window}`
                            : ""}
                        </strong>
                        <p>{t("acceptedHelp")}</p>
                        <div className="attached-context-actions">
                          <button
                            disabled={contextBusy || busy}
                            onClick={() => void attach("clipboard")}
                          >
                            <Clipboard size={13} /> {t("attachCopied")}
                          </button>
                          <button
                            disabled={contextBusy || busy}
                            onClick={() => void attach("screen")}
                          >
                            <ImagePlus size={13} /> {t("captureConfirm")}
                          </button>
                        </div>
                      </div>
                    ) : null}
                    {attachments.length > 0 ? (
                      <div className="attachments">
                        {attachments.map((a, i) => (
                          <div className="attachment-chip" key={a.kind}>
                            {a.kind === "screen" ? (
                              <ImagePlus size={13} />
                            ) : a.kind === "clipboard" ? (
                              <Clipboard size={13} />
                            ) : (
                              <Monitor size={13} />
                            )}
                            <span>
                              {a.kind === "screen"
                                ? t("confirmedScreenshot")
                                : a.kind === "clipboard"
                                  ? t("copiedCount", {
                                      count: a.content.length,
                                    })
                                  : t("appWindow")}
                            </span>
                            <button
                              disabled={busy}
                              aria-label={t("removeAttachment")}
                              onClick={() =>
                                setAttachments((list) =>
                                  list.filter((_, j) => i !== j),
                                )
                              }
                            >
                              <X size={12} />
                            </button>
                            {a.kind === "clipboard" ? (
                              <details>
                                <summary>{t("view")}</summary>
                                <pre>{a.content}</pre>
                              </details>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="composer">
                      <textarea
                        ref={inputRef}
                        aria-label={t("messageInput")}
                        value={input}
                        rows={1}
                        disabled={busy}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t("messagePlaceholder")}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            !e.shiftKey &&
                            !e.nativeEvent.isComposing
                          ) {
                            e.preventDefault();
                            void send();
                          }
                        }}
                      />
                      <button
                        className="send"
                        title={t("sendMessage")}
                        aria-label={t("sendMessage")}
                        disabled={busy || !input.trim()}
                        onClick={() => void send()}
                      >
                        <ArrowUp size={19} />
                      </button>
                    </div>
                    <div className="composer-footer">
                      <div>
                        <button
                          title={t("selectionHelp")}
                          aria-label={t("attachSelection")}
                          disabled={contextBusy || busy}
                          onClick={() => void attach("clipboard")}
                        >
                          <Clipboard size={15} />
                        </button>
                        <button
                          title={t("captureScreenHelp")}
                          aria-label={t("captureScreen")}
                          disabled={contextBusy || busy}
                          onClick={() => void attach("screen")}
                        >
                          <ImagePlus size={15} />
                        </button>
                      </div>
                      <span>
                        {t(
                          contextBusy
                            ? "acquiring"
                            : busy
                              ? "generating"
                              : snapshot.data.config.contextReminders
                                ? "passiveNote"
                                : "manualNote",
                        )}
                      </span>
                      {retryText && !busy ? (
                        <button
                          title={t("retry")}
                          onClick={() => void send(retryText)}
                        >
                          <RotateCcw size={13} />
                        </button>
                      ) : (
                        <span className="style-label">
                          {snapshot.data.config.style === "concise"
                            ? t("conciseShort")
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </main>
          </div>
        </div>
        {loading ? (
          <div className="loading-indicator">{t("loadingSettings")}</div>
        ) : null}
        {preview ? (
          <div
            className="screenshot-preview"
            role="dialog"
            aria-modal="true"
            aria-label={t("screenshotPreview")}
          >
            <div>
              <h2>{t("screenshotConfirmTitle")}</h2>
              <p>{t("screenshotPrivacy")}</p>
              <img src={preview} alt={t("screenshotAlt")} />
              <div className="preview-controls">
                <button className="outline" onClick={() => setPreview("")}>
                  {t("cancel")}
                </button>
                <button
                  className="primary"
                  onClick={() => {
                    setAttachments((a) => [
                      ...a.filter((v) => v.kind !== "screen"),
                      { kind: "screen", content: preview },
                    ]);
                    setPreview("");
                  }}
                >
                  <Check size={15} /> {t("confirmAttach")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </UiProvider>
  );
}
