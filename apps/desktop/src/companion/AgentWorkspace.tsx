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
import { terminalTask } from "./types";
const statusText: Record<string, string> = {
  submitting: "提交中",
  running: "运行中",
  in_progress: "运行中",
  completed: "已完成",
  failed: "失败",
  cancelled: "已取消",
  requires_action: "等待确认",
  cancellation_requested: "已请求取消",
  released: "云端环境已释放",
  submission_unknown: "提交结果未知",
  idle: "Provider 空闲 · 等待任务结果",
  awaiting_provider: "等待 Provider",
  approval_response_sent: "已提交确认 · 等待 Provider",
};
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
          <h1>远程任务工作台</h1>
          <p>把任务交给云端浏览器，在这里跟进真实进度与结果。</p>
        </div>
        <div className="agent-toolbar">
          <button
            onClick={() => onNavigate("models")}
            className="model-selector"
          >
            <span className="provider-label">OPENAI</span>{" "}
            {snapshot.data.config.remoteModel || "选择模型"}{" "}
            <ChevronRight size={13} />
          </button>
          <button onClick={() => onNavigate("history")}>
            <History size={17} /> History
          </button>
          <button onClick={() => onNavigate("settings")}>
            <Settings2 size={17} /> Settings
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
              <h2>给任务一个明确的目标</h2>
              <p>
                访问公开网页、对比产品、研究 GitHub 仓库。
                <br />
                任务在 Provider 托管的环境里进行。
              </p>
              {!snapshot.remoteKeyPresent ? (
                <button
                  onClick={() => onNavigate("models")}
                  className="outline"
                >
                  配置远程 Provider
                </button>
              ) : (
                <span className="status-badge ready">
                  本地密钥已配置 · 尚未验证服务可用性
                </span>
              )}
              <div className="task-examples">
                {[
                  "访问指定公开网页，比较产品价格。",
                  "研究指定 GitHub 仓库，整理存在的问题。",
                  "浏览指定网站，提取公开信息并生成报告。",
                ].map((s) => (
                  <button key={s} onClick={() => setInput(s)}>
                    <ArrowUp size={13} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="service-links">
              <span>Muse / Grok Bot：原生 API 尚未确认，保留外部入口</span>
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
                  {statusText[task.status] ?? task.status}
                </span>
                <p>
                  <span className="muted">TASK</span> {task.objective}
                </p>
                <div className="task-controls">
                  <button
                    title="刷新 Provider 状态"
                    onClick={() => void onRefresh()}
                  >
                    <RefreshCw size={17} />
                  </button>
                  {task.sessionId && !terminalTask(task.status) ? (
                    <button
                      title="向 Provider 请求取消"
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
                <span>{task.items.length} 个 Provider 记录</span>
                <span>不提供百分比进度</span>
              </div>
              {task.error ? <p className="task-error">{task.error}</p> : null}
            </section>
            {task.requiredActions.map((approval, index) => {
              const request = approval.request as
                Record<string, unknown> | undefined;
              const id = String(approval.request_id ?? "");
              const supported =
                approval.type === "computer_use_approval_request" &&
                request?.type === "browser_origin_access";
              return (
                <div className="approval-card" key={id || index}>
                  <h3>需要人工确认</h3>
                  <p>
                    {supported
                      ? `允许云端浏览器访问 ${String(request?.origin ?? "此网站")}？`
                      : "Provider 要求当前版本尚不支持的输入。任务将保持等待；可以取消。"}
                  </p>
                  {supported ? (
                    <div>
                      <button
                        className="primary"
                        onClick={() => void onControl("approve", id)}
                      >
                        允许此网站
                      </button>
                      <button
                        className="outline"
                        onClick={() => void onControl("deny", id)}
                      >
                        拒绝
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
            <div className="timeline-heading">
              <span>{task.items.length} records</span>
              <button onClick={() => setExpand(!expand)}>
                {expand ? "收起全部" : "展开全部"}
              </button>
            </div>
            <div className="step-timeline">
              {task.items.length === 0 ? (
                <p className="muted">
                  尚无 Provider 步骤记录。提交状态不代表任务完成。
                </p>
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
                      <span>{String(item.type ?? "Provider record")}</span>
                      <span className="muted">{String(item.status ?? "")}</span>
                    </summary>
                    <pre>{JSON.stringify(item, null, 2)}</pre>
                  </details>
                ))
              )}
            </div>
            {task.result ? (
              <section className="task-result">
                <h2>Result</h2>
                <p>{task.result}</p>
              </section>
            ) : null}
            {task.sessionId &&
            terminalTask(task.status) &&
            task.status !== "released" ? (
              <div className="cloud-cleanup">
                <p className="muted">
                  任务结束后可释放托管环境。费用与环境计费由 Provider 决定。
                </p>
                <button
                  className="outline"
                  onClick={() => void onControl("release")}
                >
                  释放云端环境
                </button>
              </div>
            ) : null}
          </>
        )}
        {snapshot.data.tasks.length > 0 ? (
          <div className="recent-tasks">
            <h3>最近任务</h3>
            {snapshot.data.tasks.slice(0, 5).map((t) => (
              <button key={t.id} onClick={() => onSelect(t.id)}>
                <span>{t.objective}</span>
                <small>{statusText[t.status] ?? t.status}</small>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="agent-composer">
        <textarea
          value={input}
          disabled={busy}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            snapshot.remoteKeyPresent
              ? "描述远程任务…（Enter 发送，Shift + Enter 换行）"
              : "先配置远程 Provider，再提交任务"
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
          title="提交远程任务"
          disabled={busy || !snapshot.remoteKeyPresent || !input.trim()}
          onClick={() => void submit()}
        >
          <ArrowUp size={20} />
        </button>
      </div>
      <footer className="agent-footer">
        <span>
          <span className="tiny-dot" /> OPENAI HOSTED · PUBLIC READ-ONLY
        </span>
        <button onClick={() => onOpen("pricing")}>
          费用与调用限制 <ExternalLink size={11} />
        </button>
        <span>OrdiBot V1</span>
      </footer>
    </div>
  );
}
