// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ModelSettings } from "./ModelSettings";
import { UiProvider } from "./UiContext";
import { defaultConfig, type Config, type Snapshot } from "./types";
import type { Appearance } from "./appearance";
(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
afterEach(async () => {
  if (root) await act(() => root.unmount());
  document.body.innerHTML = "";
});
function initialSnapshot(): Snapshot {
  return {
    data: {
      config: {
        ...defaultConfig,
        model: "saved-model",
        edgeSide: "right",
        edgeVertical: 0.73,
      },
      tasks: [],
      conversations: [],
    },
    keyPresent: false,
    remoteKeyPresent: false,
  };
}
async function render(
  snapshot: Snapshot,
  appearance: Appearance,
  onPreview: (p: Appearance) => void,
  onSave: (c: Config, key: string, remoteKey: string) => Promise<void>,
) {
  if (!document.getElementById("host")) {
    document.body.innerHTML = '<div id="host"></div>';
    root = createRoot(document.getElementById("host")!);
  }
  await act(() =>
    root.render(
      <UiProvider appearance={appearance}>
        <ModelSettings
          snapshot={snapshot}
          appearance={appearance}
          page="settings"
          onPreview={onPreview}
          onSave={onSave}
        />
      </UiProvider>,
    ),
  );
}
function control(label: string): HTMLSelectElement {
  return [...document.querySelectorAll("label")]
    .find((e) => e.textContent?.startsWith(label))!
    .querySelector("select")!;
}
async function click(text: string) {
  const b = [...document.querySelectorAll("button")].find(
    (e) => e.textContent === text,
  )!;
  await act(() => b.click());
}
describe("real settings lifecycle", () => {
  it.each(["http://localhost:11434/v1", "https://127.0.0.2/v1", "https://localhost./v1", "http://[::ffff:127.0.0.1]/v1"])("clears an unsaved key and disables local Chat key for %s", async (url) => {
    const snapshot=initialSnapshot();let submitted="not-saved";
    await render(snapshot,{...snapshot.data.config,language:"en"},()=>{},async (_c,key)=>{submitted=key});
    const input=(label:string)=>[...document.querySelectorAll("label")].find(e=>e.textContent?.startsWith(label))!.querySelector("input")!;
    const set=async (el:HTMLInputElement,value:string)=>act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")!.set!.call(el,value);el.dispatchEvent(new Event("input",{bubbles:true}));});
    await set(input("API Key"),"fixture-unsaved");
    await set(input("Base URL"),url);
    expect(input("API Key").value).toBe("");expect(input("API Key").disabled).toBe(true);
    await click("Save settings");expect(submitted).toBe("");
  });
  it("exposes model parameter policies and explains key binding without changing appearance", async () => {
    const snapshot = initialSnapshot();
    let saved: Config | undefined;
    await render(snapshot, {...snapshot.data.config,language:"en"},()=>{},async c=>{saved=c});
    expect([...document.querySelectorAll("label")].some(e=>e.textContent?.startsWith("Model parameters"))).toBe(true);
    const parameters=control("Model parameters");
    await act(()=>{parameters.value="completion";parameters.dispatchEvent(new Event("change",{bubbles:true}));});
    await click("Save settings");
    expect((saved as unknown as Record<string,unknown>)?.modelParameters).toBe("completion");
    expect(document.body.textContent).toContain("Keys are bound to the provider and full endpoint");
    expect(saved?.fontScale).toBe(100);expect(saved?.edgeVertical).toBe(0.73);
  });
  it("shows secure-storage save failure without claiming success", async () => {
    const snapshot=initialSnapshot();
    await render(snapshot,{...snapshot.data.config,language:"en"},()=>{},async()=>{throw "SECURE_STORAGE_UNAVAILABLE"});
    await click("Save settings");
    expect(document.querySelector('[role="alert"]')?.textContent).toContain("secure storage");
    expect([...document.querySelectorAll("button")].some(b=>b.textContent==="Saved")).toBe(false);
  });
  it("keeps current preview and incoming docking when native snapshot changes", async () => {
    const snapshot = initialSnapshot();
    const preview: Appearance = {
      language: "en",
      fontScale: 130,
      accentColor: "teal",
      backgroundStyle: "midnight",
    };
    let saved: Config | undefined;
    await render(
      snapshot,
      preview,
      () => {},
      async (c) => {
        saved = c;
      },
    );
    await render(
      {
        ...snapshot,
        data: {
          ...snapshot.data,
          config: {
            ...snapshot.data.config,
            edgeSide: "left",
            edgeVertical: 0.4,
          },
        },
      },
      preview,
      () => {},
      async (c) => {
        saved = c;
      },
    );
    expect(control("Font Size").value).toBe("130");
    expect(control("Language").value).toBe("en");
    await click("Save settings");
    expect(saved?.edgeSide).toBe("left");
    expect(saved?.edgeVertical).toBe(0.4);
    expect(saved?.fontScale).toBe(130);
    expect(saved?.model).toBe("saved-model");
  });
  it("passes only appearance fields to preview and resets without changing model/docking", async () => {
    const snapshot = initialSnapshot();
    let received: Appearance | undefined;
    let saved: Config | undefined;
    await render(
      snapshot,
      { ...snapshot.data.config, language: "en" },
      (p) => {
        received = p;
      },
      async (c) => {
        saved = c;
      },
    );
    const font = control("Font Size");
    await act(() => {
      font.value = "130";
      font.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(Object.keys(received!).sort()).toEqual([
      "accentColor",
      "backgroundStyle",
      "fontScale",
      "language",
    ]);
    await click("Reset to Defaults");
    await click("Save settings");
    expect(saved?.language).toBe("zh-CN");
    expect(saved?.fontScale).toBe(100);
    expect(saved?.model).toBe("saved-model");
    expect(saved?.edgeVertical).toBe(0.73);
  });
  it("shows a real localized save failure and never a saved state", async () => {
    const snapshot = initialSnapshot();
    await render(
      snapshot,
      { ...snapshot.data.config, language: "en" },
      () => {},
      async () => {
        throw "SETTINGS_WRITE_FAILED";
      },
    );
    await click("Save settings");
    expect(document.querySelector('[role="alert"]')?.textContent).toMatch(
      /Failed to save/,
    );
    expect(
      [...document.querySelectorAll("button")].some(
        (b) => b.textContent === "Saved",
      ),
    ).toBe(false);
    expect(
      [...document.querySelectorAll("button")].some(
        (b) => b.textContent === "Save settings" && !b.disabled,
      ),
    ).toBe(true);
  });
});
