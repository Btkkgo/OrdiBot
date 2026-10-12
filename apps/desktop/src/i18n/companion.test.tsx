import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  companionEn,
  companionZh,
  createCompanionTranslator,
  taskStatusLabel,
} from "./companion";
import { ModelSettings } from "../companion/ModelSettings";
import { AgentWorkspace } from "../companion/AgentWorkspace";
import {
  defaultConfig,
  displayError,
  type Snapshot,
  type RemoteTask,
} from "../companion/types";
import { UiProvider } from "../companion/UiContext";

describe("complete active companion localization", () => {
  it("requires both dictionaries and matching replacement slots for every key", () => {
    expect(Object.keys(companionZh).sort()).toEqual(
      Object.keys(companionEn).sort(),
    );
    for (const key of Object.keys(
      companionEn,
    ) as (keyof typeof companionEn)[]) {
      expect(companionEn[key].trim().length).toBeGreaterThan(0);
      expect(companionZh[key].trim().length).toBeGreaterThan(0);
      expect(companionZh[key].match(/\{\w+\}/g) ?? []).toEqual(
        companionEn[key].match(/\{\w+\}/g) ?? [],
      );
      expect(companionEn[key]).not.toMatch(/[\u3400-\u9fff]/);
    }
    expect(createCompanionTranslator("en")("records", { count: 2 })).toBe(
      "2 Provider records",
    );
    expect(taskStatusLabel("requires_action", "en")).toBe("Awaiting approval");
    expect(taskStatusLabel("unknown_provider_status", "en")).toBe(
      "unknown_provider_status",
    );
    expect(displayError("SETTINGS_WRITE_FAILED", "en")).toMatch(/save/i);
    expect(displayError("MODEL_KEY_NOT_CONFIGURED", "en")).not.toMatch(
      /[\u3400-\u9fff]/,
    );
  });
  it("renders English settings instead of Chinese hardcoded labels", () => {
    const snapshot: Snapshot = {
      data: {
        config: { ...defaultConfig, language: "en" },
        conversations: [],
        tasks: [],
      },
      keyPresent: false,
      remoteKeyPresent: false,
    };
    const html = renderToStaticMarkup(
      <UiProvider appearance={snapshot.data.config}>
        <ModelSettings
          snapshot={snapshot}
          page="settings"
          onSave={async () => {}}
        />
      </UiProvider>,
    );
    expect(html).toContain("Appearance &amp; Language");
    expect(html).toContain("Font Size");
    expect(html).toContain("Reset to Defaults");
    expect(html).not.toMatch(/[\u3400-\u9fff]/);
  });
  it("localizes approval and task chrome while preserving provider content", () => {
    const snapshot: Snapshot = {
      data: {
        config: { ...defaultConfig, language: "en" },
        conversations: [],
        tasks: [],
      },
      keyPresent: false,
      remoteKeyPresent: false,
    };
    const task: RemoteTask = {
      id: "t",
      objective: "用户目标 不翻译",
      sessionId: "s",
      status: "requires_action",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [{ type: "message", text: "Provider 原文 不翻译" }],
      requiredActions: [
        {
          type: "computer_use_approval_request",
          request_id: "r",
          request: {
            type: "browser_origin_access",
            origin: "https://example.com",
          },
        },
      ],
      result: "原始结果 不翻译",
      error: null,
    };
    const html = renderToStaticMarkup(
      <UiProvider appearance={snapshot.data.config}>
        <AgentWorkspace
          snapshot={snapshot}
          task={task}
          onSubmit={async () => {}}
          onRefresh={async () => {}}
          onControl={async () => {}}
          onNavigate={() => {}}
          onSelect={() => {}}
          onOpen={() => {}}
        />
      </UiProvider>,
    );
    expect(html).toContain("Awaiting approval");
    expect(html).toContain("Allow this website");
    for (const raw of [
      "用户目标 不翻译",
      "Provider 原文 不翻译",
      "原始结果 不翻译",
    ])
      expect(html).toContain(raw);
    expect(html).not.toContain("需要人工确认");
  });
  it("keeps unsaved appearance selected when settings is reopened", () => {
    const snapshot: Snapshot = {
      data: { config: defaultConfig, conversations: [], tasks: [] },
      keyPresent: false,
      remoteKeyPresent: false,
    };
    const preview = {
      ...defaultConfig,
      language: "en" as const,
      fontScale: 130 as const,
      accentColor: "teal" as const,
    };
    const html = renderToStaticMarkup(
      <UiProvider appearance={preview}>
        <ModelSettings
          snapshot={snapshot}
          appearance={preview}
          page="settings"
          onSave={async () => {}}
        />
      </UiProvider>,
    );
    expect(html).toMatch(/value="130" selected=""/);
    expect(html).toMatch(/value="en" selected=""/);
    expect(html).toMatch(/value="teal" selected=""/);
  });
});
