use base64::Engine;
use serde::Serialize;
use std::process::Command;
use tauri::Manager;
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopContext {
    pub app: String,
    pub window: String,
    pub captured_at: String,
    pub available: bool,
}
pub fn active_context() -> DesktopContext {
    #[cfg(target_os = "macos")]
    let output = Command::new("/usr/bin/osascript")
        .args([
            "-e",
            r#"tell application "System Events"
set frontApp to first application process whose frontmost is true
set appName to name of frontApp
set windowName to ""
try
set windowName to name of front window of frontApp
end try
return appName & linefeed & windowName
end tell"#,
        ])
        .output();
    #[cfg(target_os="windows")]
    let output=Command::new("powershell.exe").args(["-NoProfile","-NonInteractive","-Command",r#"Add-Type 'using System;using System.Runtime.InteropServices;using System.Text;public class W{[DllImport("user32.dll")]public static extern IntPtr GetForegroundWindow();[DllImport("user32.dll",CharSet=CharSet.Unicode)]public static extern int GetWindowText(IntPtr h,StringBuilder s,int n);[DllImport("user32.dll")]public static extern uint GetWindowThreadProcessId(IntPtr h,out uint p);}';$h=[W]::GetForegroundWindow();$s=New-Object System.Text.StringBuilder 1024;[void][W]::GetWindowText($h,$s,1024);$p=[uint32]0;[void][W]::GetWindowThreadProcessId($h,[ref]$p);(Get-Process -Id $p).ProcessName;$s.ToString()"#]).output();
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    let output: std::io::Result<std::process::Output> = Err(std::io::Error::other("unsupported"));
    let text = output
        .ok()
        .filter(|o| o.status.success())
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .unwrap_or_default();
    let mut lines = text.lines();
    let app = lines.next().unwrap_or_default().trim().to_owned();
    let window = lines.next().unwrap_or_default().trim().to_owned();
    DesktopContext {
        available: !app.is_empty(),
        app,
        window,
        captured_at: super::companion_store::now(),
    }
}
#[tauri::command]
pub async fn desktop_context(app: tauri::AppHandle) -> Result<DesktopContext, String> {
    let window = app.get_webview_window("main").ok_or("WINDOW_UNAVAILABLE")?;
    #[cfg(target_os = "macos")]
    let _ = app.hide();
    #[cfg(not(target_os = "macos"))]
    let _ = window.hide();
    tokio::time::sleep(std::time::Duration::from_millis(200)).await;
    let result = tauri::async_runtime::spawn_blocking(active_context)
        .await
        .map_err(|_| "CONTEXT_UNAVAILABLE".into());
    #[cfg(target_os = "macos")]
    let _ = app.show();
    let _ = window.show();
    let _ = window.set_focus();
    result
}
#[tauri::command]
pub async fn attach_clipboard() -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let text = arboard::Clipboard::new()
            .and_then(|mut c| c.get_text())
            .map_err(|_| "CLIPBOARD_EMPTY_OR_UNAVAILABLE")?;
        if text.trim().is_empty() {
            return Err("CLIPBOARD_EMPTY_OR_UNAVAILABLE".into());
        }
        if text.len() > 100_000 {
            return Err("CONTEXT_TOO_LARGE".into());
        }
        Ok(text)
    })
    .await
    .map_err(|_| "CLIPBOARD_UNAVAILABLE")?
}
#[tauri::command]
pub async fn capture_screen(app: tauri::AppHandle) -> Result<String, String> {
    let window = app.get_webview_window("main").ok_or("WINDOW_UNAVAILABLE")?;
    let _ = window.hide();
    let result=tauri::async_runtime::spawn_blocking(||{
        let dir=tempfile::tempdir().map_err(|_|"SCREENSHOT_FAILED")?;let path=dir.path().join("context.png");
        #[cfg(target_os="macos")]
        let status=Command::new("/usr/sbin/screencapture").args(["-i","-x","-t","png"]).arg(&path).status();
        #[cfg(target_os="windows")]
        let status=Command::new("powershell.exe").args(["-NoProfile","-NonInteractive","-Command",r#"Add-Type -AssemblyName System.Windows.Forms;Add-Type -AssemblyName System.Drawing;$b=[System.Windows.Forms.SystemInformation]::VirtualScreen;$i=New-Object System.Drawing.Bitmap $b.Width,$b.Height;$g=[System.Drawing.Graphics]::FromImage($i);$g.CopyFromScreen($b.Left,$b.Top,0,0,$i.Size);$i.Save($env:ORDIBOT_SCREENSHOT_PATH,[System.Drawing.Imaging.ImageFormat]::Png);$g.Dispose();$i.Dispose()"#]).env("ORDIBOT_SCREENSHOT_PATH",&path).status();
        #[cfg(not(any(target_os="macos",target_os="windows")))]
        let status:std::io::Result<std::process::ExitStatus>=Err(std::io::Error::other("unsupported"));
        if !status.map_err(|_|"SCREENSHOT_PERMISSION_OR_CAPTURE_FAILED")?.success() || !path.exists(){return Err("SCREENSHOT_CANCELLED_OR_PERMISSION_REQUIRED".into())}
        let bytes=std::fs::read(&path).map_err(|_|"SCREENSHOT_FAILED")?;
        if bytes.len()>8_000_000{return Err("SCREENSHOT_TOO_LARGE_USE_SMALLER_REGION".into())}
        Ok(format!("data:image/png;base64,{}",base64::engine::general_purpose::STANDARD.encode(bytes)))
    }).await.map_err(|_|"SCREENSHOT_FAILED".to_owned());
    let _ = window.show();
    let _ = window.set_focus();
    result?
}
