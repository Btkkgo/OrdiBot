import {
  companionEn,
  createCompanionTranslator,
  type TranslationKey,
} from "../i18n/companion";
export type Page =
  | "chat"
  | "context"
  | "agent"
  | "history"
  | "models"
  | "settings";
import {
  appearanceDefaults,
  type Appearance,
  type Language,
} from "./appearance";
export interface Config extends Appearance {
  provider: string;
  baseUrl: string;
  model: string;
  vision: boolean;
  outputLength: number;
  modelParameters: "standard" | "completion" | "no-temperature";
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
  ...appearanceDefaults,
  provider: "OpenAI-compatible",
  baseUrl: "https://api.openai.com/v1",
  model: "",
  vision: false,
  outputLength: 1024,
  modelParameters: "standard",
  style: "concise",
  alwaysOnTop: true,
  remoteModel: "gpt-6-astra",
  contextReminders: true,
  browsersEditorsOnly: false,
  edgeSide: "left",
  edgeVertical: 0.5,
};
export function displayError(
  error: unknown,
  language: Language = "zh-CN",
): string {
  const code = typeof error === "string" ? error : "LOCAL_OPERATION_FAILED";
  const t = createCompanionTranslator(language);
  const key = `error.${code}`;
  if (Object.hasOwn(companionEn, key)) return t(key as TranslationKey);
  if (code.startsWith("REMOTE_HTTP_"))
    return t("error.http", { code: code.slice(12) });
  return /^[A-Z_0-9]+$/.test(code)
    ? t("error.code", { code })
    : t("error.generic");
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
