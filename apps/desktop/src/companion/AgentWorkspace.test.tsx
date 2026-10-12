import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AgentWorkspace } from "./AgentWorkspace";
import { defaultConfig, type Snapshot, type RemoteTask } from "./types";
const s: Snapshot = {
  data: { config: defaultConfig, conversations: [], tasks: [] },
  keyPresent: false,
  remoteKeyPresent: false,
};
const props = {
  snapshot: s,
  onSubmit: async () => {},
  onRefresh: async () => {},
  onControl: async () => {},
  onNavigate: () => {},
  onSelect: () => {},
  onOpen: () => {},
};
const task: RemoteTask = {
  id: "local",
  objective: "Read public page",
  sessionId: "sess_test",
  status: "running",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [],
  requiredActions: [],
  result: "",
  error: null,
};
describe("truthful hosted Agent workspace", () => {
  it("disables submission without credentials and shows no invented timeline", () => {
    const html = renderToStaticMarkup(
      <AgentWorkspace {...props} task={undefined} />,
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain("配置远程 Provider");
    expect(html).not.toContain("step-number");
    expect(html).not.toContain("向 Provider 请求取消");
  });
  it("displays only actual Provider records and never shows pause", () => {
    const html = renderToStaticMarkup(
      <AgentWorkspace
        {...props}
        task={{
          ...task,
          items: [
            { id: "a", type: "message", status: "completed" },
            { id: "b", type: "computer_call", status: "in_progress" },
          ],
        }}
      />,
    );
    expect(html).toContain("2 个 Provider 记录");
    expect(html.match(/class="step-number"/g)).toHaveLength(2);
    expect(html).toContain("向 Provider 请求取消");
    expect(html).not.toContain("Pause");
    expect(html).not.toContain("47 steps");
  });
  it("unsupported sign-in request remains blocked without an approval button", () => {
    const html = renderToStaticMarkup(
      <AgentWorkspace
        {...props}
        task={{
          ...task,
          status: "requires_action",
          requiredActions: [
            {
              type: "computer_use_approval_request",
              request_id: "r",
              request: { type: "browser_authentication" },
            },
          ],
        }}
      />,
    );
    expect(html).toContain("尚不支持的输入");
    expect(html).not.toContain("允许此网站");
  });
});
