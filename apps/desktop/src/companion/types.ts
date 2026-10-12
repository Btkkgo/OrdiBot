export type Page =
  "chat" | "context" | "agent" | "history" | "models" | "settings";
export interface Config {
  provider: string;
  baseUrl: string;
  model: string;
  vision: boolean;
  outputLength: number;
  style: "concise" | "normal" | "detailed";
  alwaysOnTop: boolean;
  remoteModel: string;
  contextReminders: boolean;
  browsersEditorsOnly: boolean;
  edgeSide: "left" | "right";
  edgeVertical: number;
}
export interface Message {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}
export interface RemoteTask {
  id: string;
  objective: string;
  sessionId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: Record<string, unknown>[];
  requiredActions: Record<string, unknown>[];
  result: string;
  error: string | null;
}
export interface Snapshot {
  data: { config: Config; conversations: Conversation[]; tasks: RemoteTask[] };
  keyPresent: boolean;
  remoteKeyPresent: boolean;
  shortcutAvailable?: boolean;
}
export interface Attachment {
  kind: "clipboard" | "screen" | "app";
  content: string;
}
export interface DesktopContext {
  app: string;
  window: string;
  capturedAt: string;
  available: boolean;
}
export const defaultConfig: Config = {
  provider: "OpenAI-compatible",
  baseUrl: "https://api.openai.com/v1",
  model: "",
  vision: false,
  outputLength: 1024,
  style: "concise",
  alwaysOnTop: true,
  remoteModel: "gpt-6-astra",
  contextReminders: true,
  browsersEditorsOnly: false,
  edgeSide: "left",
  edgeVertical: 0.5,
};
export function displayError(error: unknown): string {
  const code = typeof error === "string" ? error : "LOCAL_OPERATION_FAILED";
  const errors: Record<string, string> = {
    MODEL_KEY_NOT_CONFIGURED: "请先在 Models 中配置本地 API Key。",
    INVALID_MODEL_SETTINGS: "请填写 Model ID，并检查输出长度。",
    INVALID_BASE_URL: "Base URL 需要 HTTPS，或本机 HTTP 地址；不能包含密钥。",
    VISION_NOT_ENABLED: "当前模型未启用视觉能力，请移除截图或切换视觉模型。",
    CLIPBOARD_EMPTY_OR_UNAVAILABLE:
      "剪贴板中没有可读取的文字，请先复制所选内容。",
    SCREENSHOT_CANCELLED_OR_PERMISSION_REQUIRED:
      "截图已取消，或需要在系统设置中允许屏幕录制。",
    SECURE_STORAGE_UNAVAILABLE: "系统安全凭据存储不可用，请检查本地权限。",
    REMOTE_KEY_NOT_CONFIGURED: "请先在 Models 中配置 OpenAI Agents API Key。",
    GENERATION_CANCELLED: "已取消生成。",
    NETWORK_ERROR: "网络连接失败，可以重试。",
    TIMEOUT: "模型请求超时，可以重试。",
    AUTHENTICATION: "API 认证失败，请检查本地配置。",
    RATE_LIMITED: "服务限流，请稍后重试。",
    GENERATION_ALREADY_RUNNING: "已有回复正在生成。",
    SCREENSHOT_TOO_LARGE_USE_SMALLER_REGION: "截图过大，请选取更小区域。",
    CONTEXT_TOO_LARGE: "内容过长，请缩短后附加。",
  };
  if (code.startsWith("REMOTE_HTTP_"))
    return `远程 Provider 拒绝请求（HTTP ${code.slice(12)}），请检查权限、模型和额度。`;
  return (
    errors[code] ??
    (code.match(/^[A-Z_0-9]+$/)
      ? `操作未完成：${code}`
      : "本地操作未完成，请检查桌面运行环境。")
  );
}
export function visibleMessage(content: string): string {
  return content
    .split("\n\n<user_attached_clipboard_text>")[0]
    .split("\n\n<actively_acquired_window_metadata>")[0]
    .split("\n[User-confirmed screenshot")[0];
}
export const terminalTask = (s: string) =>
  [
    "completed",
    "failed",
    "cancelled",
    "released",
    "submission_unknown",
  ].includes(s);

export interface PresenceSnapshot {
  surface: "hidden" | "edge" | "chat" | "agent";
  side: "left" | "right";
  vertical: number;
  reminder: DesktopContext | null;
  latest: DesktopContext | null;
  remindersEnabled: boolean;
}
