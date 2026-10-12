import { useCallback, useEffect, useRef, useState } from "react";
import { invoke, Channel, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
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
  { id: "chat", label: "Chat", Icon: MessageCircle },
  { id: "context", label: "Context", Icon: ScanText },
  { id: "agent", label: "Agent", Icon: Sparkles },
  { id: "history", label: "History", Icon: History },
  { id: "models", label: "Models", Icon: SlidersHorizontal },
  { id: "settings", label: "Settings", Icon: Settings2 },
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
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [contextBusy, setContextBusy] = useState(false);
  const [conversation, setConversation] = useState<Conversation>();
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [preview, setPreview] = useState("");
  const [context, setContext] = useState<DesktopContext>();
  const [reminder, setReminder] = useState<DesktopContext | null>(null);
  const drag = useSurfaceDrag(undefined, (e) => setError(displayError(e)));
  const [taskId, setTaskId] = useState<string>();
  const [newTask, setNewTask] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryText, setRetryText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
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
      setError(displayError(e));
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
      setError(displayError(e));
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = "zh-CN";
    let disposed = false;
    let stop: (() => void) | undefined;
    void refresh()
      .then((s) => {
        if (!disposed) setConversation(s.data.conversations[0]);
      })
      .catch((e) => {
        if (!disposed)
          setError(
            isTauri()
              ? displayError(e)
              : "请使用 OrdiBot 原生桌面应用。浏览器预览无法读取桌面内容。",
          );
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
          if (!disposed) setError(displayError(e));
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
      if (e.kind === "started")
        setConversation((c) => (c ? { ...c, id: e.conversationId } : c));
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
      setError(displayError(e));
      setRetryText(text);
      try {
        const s = await refresh();
        const persisted =
          s.data.conversations.find((c) => c.id === previous?.id) ||
          s.data.conversations.find((c) => c.title === text.slice(0, 36));
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
    <div
      className={`companion-container dock-${snapshot.data.config.edgeSide} ${page === "agent" ? "agent-mode" : ""}`}
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
                  ? "Provider configured"
                  : "Provider not configured"}
              </span>
              <button
                title="收起窗口"
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
          <nav className="nav-rail" aria-label="主导航">
            <div className="rail-top">
              {nav.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={page === id ? "active" : ""}
                  title={label}
                  aria-label={label}
                  onClick={() => void navigate(id)}
                >
                  <Icon size={19} strokeWidth={1.65} />
                </button>
              ))}
            </div>
            <button
              className="rail-new"
              title={page === "agent" ? "新建远程任务" : "新对话"}
              aria-label="新对话"
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
                  <span>{snapshot.data.config.model || "选择模型"}</span>
                  <ChevronDown size={12} />
                </button>
                <div className="window-controls">
                  {snapshot.data.config.alwaysOnTop ? (
                    <Pin size={12} className="pin-indicator" />
                  ) : null}
                  <button
                    title="收起到边缘小宠物 · ⌘⇧Space 展开"
                    aria-label="收起窗口"
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
                  正在查看：{reminder.app}
                  {reminder.window ? ` · ${reminder.window}` : ""}
                </span>
                <span className="muted">附加元数据</span>
              </button>
            ) : null}
            {error ? (
              <div className="inline-error" role="alert">
                <span>{error}</span>
                <button aria-label="关闭提示" onClick={() => setError("")}>
                  <X size={13} />
                </button>
              </div>
            ) : null}
            {page === "models" || page === "settings" ? (
              <ModelSettings
                page={page}
                snapshot={snapshot}
                onSave={async (config, key, remoteKey) => {
                  setError("");
                  try {
                    await invoke("save_companion_config", {
                      config,
                      apiKey: key || null,
                      remoteApiKey: remoteKey || null,
                    });
                    await refresh();
                  } catch (e) {
                    setError(displayError(e));
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
                      invoke<RemoteTask>("remote_refresh", { taskId: task.id }),
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
                <div className="eyebrow">YOUR CONVERSATIONS</div>
                <h1>历史记录</h1>
                <button className="outline" disabled={busy} onClick={startNew}>
                  <Plus size={15} /> 新对话
                </button>
                <h2>Chat</h2>
                {snapshot.data.conversations.length === 0 ? (
                  <p className="muted">还没有对话记录。</p>
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
                      <small>{c.messages.length} 条消息</small>
                    </button>
                  ))
                )}
                <h2>Remote Agent</h2>
                {snapshot.data.tasks.length === 0 ? (
                  <p className="muted">还没有远程任务。</p>
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
                      <small>{t.status}</small>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <>
                <div className="context-status">
                  <span className="tiny-dot" />
                  {context?.available
                    ? `${context.app}${context.window ? " · " + context.window : ""}（仅应用/标题）`
                    : "未读取电脑内容"}
                  <button
                    title="主动读取当前 App / Window"
                    aria-label="刷新当前 App 信息"
                    disabled={contextBusy || busy}
                    onClick={() => void attach("app")}
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
                <div className="chat-scroll">
                  {page === "context" ? (
                    <div className="context-panel">
                      <div className="eyebrow">CONTEXT ASSISTANT</div>
                      <h2>围绕眼前的内容提问</h2>
                      <p>先主动附加，再发送问题。</p>
                      <button
                        disabled={contextBusy || busy}
                        onClick={() => void attach("clipboard")}
                      >
                        <Clipboard size={16} />
                        <span>
                          Ask about Selection
                          <small>先复制选中文字，再附加</small>
                        </span>
                      </button>
                      <button
                        disabled={contextBusy || busy}
                        onClick={() => void attach("screen")}
                      >
                        <ImagePlus size={16} />
                        <span>
                          Ask about Screen
                          <small>截取屏幕，预览后确认</small>
                        </span>
                      </button>
                      <button
                        disabled={contextBusy || busy}
                        onClick={() => void attach("screen", true)}
                      >
                        <ImagePlus size={16} />
                        <span>
                          区域截图<small>macOS 拖选区域 · Esc 取消</small>
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
                          Normal Chat<small>不附加电脑内容</small>
                        </span>
                      </button>
                    </div>
                  ) : null}
                  {!conversation?.messages.length ? (
                    <div className="welcome">
                      <span className="welcome-kicker">HELLO, I'M ORDIBOT</span>
                      <h1>有什么我能帮你？</h1>
                      <p>聊一聊，或者附加你眼前的内容。</p>
                      <div className="welcome-actions">
                        <button
                          disabled={contextBusy}
                          onClick={() => void attach("clipboard")}
                        >
                          <Clipboard size={14} /> 选中文字
                        </button>
                        <button
                          disabled={contextBusy}
                          onClick={() => void attach("screen")}
                        >
                          <ImagePlus size={14} /> 截图提问
                        </button>
                      </div>
                      {!snapshot.data.config.model ? (
                        <button
                          className="configure-hint"
                          onClick={() => void navigate("models")}
                        >
                          连接你的 AI 模型 <ChevronDown size={12} />
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
                            <Clipboard size={11} /> 已附加文字
                          </span>
                        ) : null}
                        {m.content.includes("[User-confirmed screenshot") ? (
                          <span className="message-context">
                            <ImagePlus size={11} /> 已附加截图
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
                        title="取消生成"
                        onClick={() =>
                          void operation(() => invoke("chat_cancel"))
                        }
                      >
                        <Square size={12} /> 取消
                      </button>
                    </article>
                  ) : null}
                  <div ref={bottom} />
                </div>
                <div className="chat-bottom">
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
                              ? "已确认截图"
                              : a.kind === "clipboard"
                                ? `${a.content.length} 字 · 复制的内容`
                                : "App / Window 信息"}
                          </span>
                          <button
                            disabled={busy}
                            aria-label="移除附件"
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
                              <summary>查看</summary>
                              <pre>{a.content}</pre>
                            </details>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="composer">
                    <textarea
                      aria-label="消息输入"
                      value={input}
                      rows={1}
                      disabled={busy}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="输入消息…"
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
                      title="发送消息"
                      aria-label="发送消息"
                      disabled={busy || !input.trim()}
                      onClick={() => void send()}
                    >
                      <ArrowUp size={19} />
                    </button>
                  </div>
                  <div className="composer-footer">
                    <div>
                      <button
                        title="附加复制的选中文字"
                        aria-label="附加选中文字"
                        disabled={contextBusy || busy}
                        onClick={() => void attach("clipboard")}
                      >
                        <Clipboard size={15} />
                      </button>
                      <button
                        title="主动截图并预览确认"
                        aria-label="截取屏幕"
                        disabled={contextBusy || busy}
                        onClick={() => void attach("screen")}
                      >
                        <ImagePlus size={15} />
                      </button>
                    </div>
                    <span>
                      {contextBusy
                        ? "正在获取内容…"
                        : busy
                          ? "模型正在生成…"
                          : "只读取你主动附加的内容"}
                    </span>
                    {retryText && !busy ? (
                      <button title="重试" onClick={() => void send(retryText)}>
                        <RotateCcw size={13} />
                      </button>
                    ) : (
                      <span className="style-label">
                        {snapshot.data.config.style === "concise" ? "简洁" : ""}
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
        <div className="loading-indicator">正在读取本地设置…</div>
      ) : null}
      {preview ? (
        <div
          className="screenshot-preview"
          role="dialog"
          aria-modal="true"
          aria-label="截图预览"
        >
          <div>
            <h2>确认要附加的截图</h2>
            <p>发送消息时，截图才会交给所选模型。</p>
            <img src={preview} alt="用户主动截取的上下文预览" />
            <div className="preview-controls">
              <button className="outline" onClick={() => setPreview("")}>
                取消
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
                <Check size={15} /> 确认附加
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
