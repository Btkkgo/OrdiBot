import { useState } from "react";
import {
  ArrowUp,
  Clock3,
  History,
  Settings2,
  Square,
  Globe,
  ChevronRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import type { RemoteTask, Snapshot } from "./types";
import { terminalTask, displayError } from "./types";
import { useUi } from "./UiContext";
import { taskStatusLabel } from "../i18n/companion";
export function AgentWorkspace({
  snapshot,
  task,
  onSubmit,
  onRefresh,
  onControl,
  onNavigate,
  onSelect,
  onOpen,
}: {
  snapshot: Snapshot;
  task: RemoteTask | undefined;
  onSubmit: (s: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onControl: (action: string, requestId?: string) => Promise<void>;
  onNavigate: (page: "models" | "history" | "settings") => void;
  onSelect: (id: string) => void;
  onOpen: (service: string) => void;
}) {
  const { t, language } = useUi();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [expand, setExpand] = useState(false);
  const submit = async () => {
    if (!input.trim()) return;
    setBusy(true);
    try {
      await onSubmit(input);
      setInput("");
    } finally {
      setBusy(false);
    }
  };
  const elapsed = task
    ? Math.max(
        0,
        Math.round(
          (new Date(
            terminalTask(task.status) ? task.updatedAt : Date.now(),
          ).getTime() -
            new Date(task.createdAt).getTime()) /
            1000,
        ),
      )
    : 0;
  return (
    <div className="agent-workspace">
      <header className="agent-heading">
        <div>
          <div className="eyebrow">ORDIBOT AGENT</div>
          <h1>{t("agentTitle")}</h1>
          <p>{t("agentIntro")}</p>
        </div>
        <div className="agent-toolbar">
          <button
            onClick={() => onNavigate("models")}
            className="model-selector"
          >
            <span className="provider-label">OPENAI</span>{" "}
            {snapshot.data.config.remoteModel || t("chooseModel")}{" "}
            <ChevronRight size={13} />
          </button>
          <button onClick={() => onNavigate("history")}>
            <History size={17} /> {t("nav.history")}
          </button>
          <button onClick={() => onNavigate("settings")}>
            <Settings2 size={17} /> {t("nav.settings")}
          </button>
        </div>
      </header>
      <div className="agent-scroll">
        {!task ? (
          <>
            <div className="agent-empty">
              <div className="agent-orb">
                <Globe size={28} />
              </div>
              <h2>{t("agentEmptyTitle")}</h2>
              <p>{t("agentEmptyIntro")}</p>
              {!snapshot.remoteKeyPresent ? (
                <button
                  onClick={() => onNavigate("models")}
                  className="outline"
                >
                  {t("configureRemote")}
                </button>
              ) : (
                <span className="status-badge ready">
                  {t("remoteKeyReady")}
                </span>
              )}
              <div className="task-examples">
                {[
                  t("example.price"),
                  t("example.repo"),
                  t("example.report"),
                ].map((s) => (
                  <button key={s} onClick={() => setInput(s)}>
                    <ArrowUp size={13} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="service-links">
              <span>{t("externalServices")}</span>
              <button onClick={() => onOpen("muse")}>
                Muse <ExternalLink size={12} />
              </button>
              <button onClick={() => onOpen("grok")}>
                Grok Bot <ExternalLink size={12} />
              </button>
            </div>
          </>
        ) : (
          <>
            <section className="task-summary">
              <div className="task-summary-row">
                <span
                  className={`status-badge ${task.status === "completed" ? "ready" : ""}`}
                >
                  {taskStatusLabel(task.status, language)}
                </span>
                <p>
                  <span className="muted">{t("task")}</span> {task.objective}
                </p>
                <div className="task-controls">
                  <button
                    title={t("refreshProvider")}
                    onClick={() => void onRefresh()}
                  >
                    <RefreshCw size={17} />
                  </button>
                  {task.sessionId && !terminalTask(task.status) ? (
                    <button
                      title={t("cancelProvider")}
                      onClick={() => void onControl("cancel")}
                    >
                      <Square size={17} />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="task-metrics">
                <span>
                  <Clock3 size={14} /> {Math.floor(elapsed / 60)}:
                  {String(elapsed % 60).padStart(2, "0")}
                </span>
                <span>{t("records", { count: task.items.length })}</span>
                <span>{t("noPercent")}</span>
              </div>
              {task.error ? (
                <p className="task-error">
                  {/^[A-Z_0-9]+$/.test(task.error)
                    ? displayError(task.error, language)
                    : task.error}
                </p>
              ) : null}
            </section>
            {task.requiredActions.map((approval, index) => {
              const request = approval.request as
                | Record<string, unknown>
                | undefined;
              const id = String(approval.request_id ?? "");
              const supported =
                approval.type === "computer_use_approval_request" &&
                request?.type === "browser_origin_access";
              return (
                <div className="approval-card" key={id || index}>
                  <h3>{t("approvalTitle")}</h3>
                  <p>
                    {supported
                      ? t("approvalOrigin", {
                          origin: String(request?.origin ?? t("thisWebsite")),
                        })
                      : t("unsupportedApproval")}
                  </p>
                  {supported ? (
                    <div>
                      <button
                        className="primary"
                        onClick={() => void onControl("approve", id)}
                      >
                        {t("allowWebsite")}
                      </button>
                      <button
                        className="outline"
                        onClick={() => void onControl("deny", id)}
                      >
                        {t("deny")}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div className="timeline-heading">
              <span>{t("records", { count: task.items.length })}</span>
              <button onClick={() => setExpand(!expand)}>
                {t(expand ? "collapseAll" : "expandAll")}
              </button>
            </div>
            <div className="step-timeline">
              {task.items.length === 0 ? (
                <p className="muted">{t("noProviderRecords")}</p>
              ) : (
                task.items.map((item, index) => (
                  <details
                    key={String(item.id ?? index)}
                    open={expand || undefined}
                  >
                    <summary>
                      <span className="step-dot">
                        {item.status === "completed" ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <Circle size={12} />
                        )}
                      </span>
                      <span className="step-number">#{index + 1}</span>
                      <span>{String(item.type ?? t("providerRecord"))}</span>
                      <span className="muted">
                        {taskStatusLabel(String(item.status ?? ""), language)}
                      </span>
                    </summary>
                    <pre>{JSON.stringify(item, null, 2)}</pre>
                  </details>
                ))
              )}
            </div>
            {task.result ? (
              <section className="task-result">
                <h2>{t("result")}</h2>
                <p>{task.result}</p>
              </section>
            ) : null}
            {task.sessionId &&
            terminalTask(task.status) &&
            task.status !== "released" ? (
              <div className="cloud-cleanup">
                <p className="muted">{t("releaseInfo")}</p>
                <button
                  className="outline"
                  onClick={() => void onControl("release")}
                >
                  {t("releaseEnvironment")}
                </button>
              </div>
            ) : null}
          </>
        )}
        {snapshot.data.tasks.length > 0 ? (
          <div className="recent-tasks">
            <h3>{t("recentTasks")}</h3>
            {snapshot.data.tasks.slice(0, 5).map((t) => (
              <button key={t.id} onClick={() => onSelect(t.id)}>
                <span>{t.objective}</span>
                <small>{taskStatusLabel(t.status, language)}</small>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="agent-composer">
        <textarea
          aria-label={t("agentInput")}
          value={input}
          disabled={busy}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            snapshot.remoteKeyPresent
              ? t("agentPlaceholder")
              : t("agentConfigureFirst")
          }
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              void submit();
            }
          }}
        />
        <button
          className="primary send"
          title={t("submitTask")}
          disabled={busy || !snapshot.remoteKeyPresent || !input.trim()}
          onClick={() => void submit()}
        >
          <ArrowUp size={20} />
        </button>
      </div>
      <footer className="agent-footer">
        <span>
          <span className="tiny-dot" /> {t("hostedReadOnly")}
        </span>
        <button onClick={() => onOpen("pricing")}>
          {t("pricing")} <ExternalLink size={11} />
        </button>
        <span>OrdiBot V1</span>
      </footer>
    </div>
  );
}
