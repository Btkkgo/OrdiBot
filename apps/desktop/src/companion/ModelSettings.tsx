import { useEffect, useState } from "react";
import { Check, KeyRound, Pin, ShieldCheck } from "lucide-react";
import type { Config, Snapshot } from "./types";
export function ModelSettings({
  snapshot,
  page,
  onSave,
}: {
  snapshot: Snapshot;
  page: "models" | "settings";
  onSave: (config: Config, key: string, remoteKey: string) => Promise<void>;
}) {
  const [config, setConfig] = useState(snapshot.data.config);
  const [key, setKey] = useState("");
  const [remoteKey, setRemoteKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => setConfig(snapshot.data.config), [snapshot.data.config]);
  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSave(config, key, remoteKey);
      setKey("");
      setRemoteKey("");
      setSaved(true);
    } catch {
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };
  const field = (name: keyof Config, value: string | boolean | number) => {
    setSaved(false);
    setConfig((c) => ({ ...c, [name]: value }));
  };
  return (
    <div className="settings-view">
      <div className="eyebrow">YOUR DESKTOP AI COMPANION</div>
      <h1>{page === "models" ? "模型与服务" : "偏好设置"}</h1>
      <p className="muted">配置保存在这台电脑，密钥交给系统安全存储。</p>
      <section className="settings-section">
        <h2>
          <KeyRound size={16} /> Chat · OpenAI-compatible API
        </h2>
        <label>
          Provider
          <input
            value={config.provider}
            onChange={(e) => field("provider", e.target.value)}
          />
        </label>
        <label>
          Base URL
          <input
            value={config.baseUrl}
            spellCheck={false}
            onChange={(e) => field("baseUrl", e.target.value)}
            placeholder="https://api.openai.com/v1"
          />
        </label>
        <label>
          Model ID
          <input
            value={config.model}
            spellCheck={false}
            onChange={(e) => field("model", e.target.value)}
            placeholder="填写服务提供的模型 ID"
          />
        </label>
        <label>
          API Key{" "}
          <span className="muted">
            {snapshot.keyPresent ? "已安全保存 · 留空保留" : "尚未配置"}
          </span>
          <input
            type="password"
            autoComplete="off"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="仅在本地填写"
          />
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={config.vision}
            onChange={(e) => field("vision", e.target.checked)}
          />{" "}
          模型支持视觉输入
        </label>
        <label>
          Output Length
          <input
            type="number"
            min={256}
            max={8192}
            step={256}
            value={config.outputLength}
            onChange={(e) => field("outputLength", Number(e.target.value))}
          />
        </label>
      </section>
      <section className="settings-section">
        <h2>
          <ShieldCheck size={16} /> Remote · OpenAI hosted Agent
        </h2>
        <p className="muted">
          独立云端浏览器服务，需要 Agents
          权限及额度。不会使用你的本地电脑执行任务。
        </p>
        <label>
          Agent Model ID
          <input
            value={config.remoteModel}
            onChange={(e) => field("remoteModel", e.target.value)}
          />
        </label>
        <label>
          OpenAI Agents API Key{" "}
          <span className="muted">
            {snapshot.remoteKeyPresent ? "已安全保存 · 留空保留" : "尚未配置"}
          </span>
          <input
            type="password"
            autoComplete="off"
            value={remoteKey}
            onChange={(e) => setRemoteKey(e.target.value)}
            placeholder="需要 api.agents.read/write 与 api.responses.write"
          />
        </label>
      </section>
      <section className="settings-section">
        <h2>回答与窗口</h2>
        <label>
          回答风格
          <select
            value={config.style}
            onChange={(e) => field("style", e.target.value)}
          >
            <option value="concise">Concise · 简洁（默认）</option>
            <option value="normal">Normal · 普通</option>
            <option value="detailed">Detailed · 详细</option>
          </select>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={config.alwaysOnTop}
            onChange={(e) => field("alwaysOnTop", e.target.checked)}
          />
          <Pin size={14} /> 窗口置顶
        </label>
        <p className="muted">
          {snapshot.shortcutAvailable
            ? "⌘ / Ctrl + Shift + Space 重新打开窗口。"
            : "快捷键未注册成功，请使用菜单栏恢复。"}{" "}
          菜单栏也可以恢复或退出应用。
        </p>
      </section>
      <button
        className="primary save-button"
        disabled={saving}
        onClick={() => void save()}
      >
        {saved ? (
          <>
            <Check size={15} /> 已保存
          </>
        ) : saving ? (
          "正在保存…"
        ) : (
          "保存设置"
        )}
      </button>
      <p className="privacy-note">
        只在你主动附加时读取内容。截图确认后才会发送；截图像素不保存到历史文件。
      </p>
    </div>
  );
}
