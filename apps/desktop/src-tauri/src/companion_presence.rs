use super::companion_platform::DesktopContext;
use serde::Serialize;
use std::sync::Mutex;

#[derive(Clone, Copy, Debug, Default, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Surface {
    Hidden,
    #[default]
    Edge,
    Chat,
    Agent,
}
#[derive(Default)]
pub struct PresenceState {
    pub surface: Mutex<Surface>,
    pub latest: Mutex<Option<DesktopContext>>,
    pub reminder: Mutex<Option<DesktopContext>>,
    pub drag: Mutex<Option<(String, i32, i32, f64)>>,
}

#[derive(Default)]
pub struct ReminderTracker {
    observed: String,
    pending: Option<DesktopContext>,
    last_emitted: Option<u64>,
    recent: std::collections::VecDeque<(String, u64)>,
}
impl ReminderTracker {
    fn observe(&mut self, context: DesktopContext, seconds: u64) -> Option<DesktopContext> {
        if !context.available || self_app(&context.app) {
            return None;
        }
        let key = format!("{}\n{}", context.app, context.window);
        while self
            .recent
            .front()
            .is_some_and(|(_, t)| seconds.saturating_sub(*t) > 120)
        {
            self.recent.pop_front();
        }
        if key != self.observed {
            self.observed = key.clone();
            self.pending = if self.recent.iter().any(|(k, _)| k == &key) {
                None
            } else {
                Some(context)
            };
        }
        if self
            .last_emitted
            .is_some_and(|t| seconds.saturating_sub(t) < 20)
        {
            return None;
        }
        let next = self.pending.take()?;
        self.last_emitted = Some(seconds);
        self.recent
            .push_back((format!("{}\n{}", next.app, next.window), seconds));
        if self.recent.len() > 32 {
            self.recent.pop_front();
        }
        Some(next)
    }
}
fn edge_coordinates(
    left: i32,
    top: i32,
    width: u32,
    height: u32,
    scale: f64,
    side: &str,
    vertical: f64,
    popup: bool,
) -> (i32, i32) {
    let w = ((if popup { 336.0 } else { 56.0 }) * scale).round() as i32;
    let h = (64.0 * scale).round() as i32;
    let x = if side == "right" {
        left + (width as i32 - w).max(0)
    } else {
        left
    };
    let y = top + (((height as i32 - h).max(0) as f64) * vertical.clamp(0.0, 1.0)).round() as i32;
    (x, y)
}
fn self_app(app: &str) -> bool {
    matches!(
        app.to_ascii_lowercase().as_str(),
        "ordibot" | "ordibot-desktop"
    )
}
fn browser_or_editor(app: &str) -> bool {
    let app = app.to_lowercase();
    [
        "chrome",
        "safari",
        "firefox",
        "microsoft edge",
        "brave",
        "visual studio",
        "intellij",
        "webstorm",
        "sublime",
    ]
    .iter()
    .any(|name| app.contains(name))
        || matches!(app.as_str(), "code" | "arc" | "cursor" | "zed")
}

#[cfg(test)]
mod tests {
    use super::*;
    fn context(app: &str, window: &str) -> DesktopContext {
        DesktopContext {
            app: app.into(),
            window: window.into(),
            captured_at: "time".into(),
            available: true,
        }
    }
    #[test]
    fn metadata_reminders_are_throttled_deduplicated_and_deliver_latest_change() {
        let mut t = ReminderTracker::default();
        assert!(t.observe(context("Chrome", "one"), 0).is_some());
        assert!(t.observe(context("Chrome", "one"), 3).is_none());
        assert!(t.observe(context("Code", "two"), 5).is_none());
        assert!(t.observe(context("Preview", "three"), 8).is_none());
        assert_eq!(
            t.observe(context("Preview", "three"), 20).unwrap().window,
            "three"
        );
        assert!(t.observe(context("Chrome", "one"), 40).is_none());
        assert!(t.observe(context("Chrome", "one"), 130).is_none());
    }
    #[test]
    fn docking_respects_display_offset_scale_and_bounds() {
        assert_eq!(
            edge_coordinates(-1920, 30, 1920, 1050, 1.0, "left", 0.5, false),
            (-1920, 523)
        );
        assert_eq!(
            edge_coordinates(0, 50, 2880, 1700, 2.0, "right", 1.0, false),
            (2768, 1622)
        );
        assert_eq!(
            edge_coordinates(0, 50, 2880, 1700, 2.0, "right", 0.0, true),
            (2208, 50)
        );
    }
    #[test]
    fn browser_editor_filter_and_self_exclusion_are_explicit() {
        assert!(browser_or_editor("Google Chrome"));
        assert!(browser_or_editor("Code"));
        assert!(!browser_or_editor("Preview"));
        assert!(!browser_or_editor("Archive Utility"));
        let mut t = ReminderTracker::default();
        assert!(t.observe(context("OrdiBot", "OrdiBot"), 0).is_none());
        assert!(t.observe(context("ordibot-desktop", ""), 3).is_none());
    }
}

use super::companion_store::{CompanionState, Config};
use tauri::{Emitter, Manager};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PresenceSnapshot {
    surface: Surface,
    side: String,
    vertical: f64,
    reminder: Option<DesktopContext>,
    latest: Option<DesktopContext>,
    reminders_enabled: bool,
}
#[tauri::command]
pub fn presence_snapshot(app: tauri::AppHandle) -> Result<PresenceSnapshot, String> {
    let state = app.state::<PresenceState>();
    let data = app.state::<CompanionState>();
    let config = &data.stored.lock().map_err(|_| "STATE_UNAVAILABLE")?.config;
    Ok(PresenceSnapshot {
        surface: *state.surface.lock().map_err(|_| "STATE_UNAVAILABLE")?,
        side: config.edge_side.clone(),
        vertical: config.edge_vertical,
        reminder: state
            .reminder
            .lock()
            .map_err(|_| "STATE_UNAVAILABLE")?
            .clone(),
        latest: state
            .latest
            .lock()
            .map_err(|_| "STATE_UNAVAILABLE")?
            .clone(),
        reminders_enabled: config.context_reminders,
    })
}
fn notify(app: &tauri::AppHandle) {
    if let Ok(snapshot) = presence_snapshot(app.clone()) {
        let _ = app.emit("ordibot:presence", snapshot);
    }
}
fn config(app: &tauri::AppHandle) -> Config {
    app.state::<CompanionState>()
        .stored
        .lock()
        .unwrap()
        .config
        .clone()
}
pub fn position_edge(app: &tauri::AppHandle, popup: bool) -> Result<(), String> {
    let edge = app.get_webview_window("edge").ok_or("WINDOW_UNAVAILABLE")?;
    let monitor = edge
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| {
            app.get_webview_window("main")
                .and_then(|w| w.current_monitor().ok().flatten())
        })
        .or_else(|| edge.primary_monitor().ok().flatten())
        .ok_or("MONITOR_UNAVAILABLE")?;
    let area = monitor.work_area();
    let c = config(app);
    let (x, y) = edge_coordinates(
        area.position.x,
        area.position.y,
        area.size.width,
        area.size.height,
        monitor.scale_factor(),
        &c.edge_side,
        c.edge_vertical,
        popup,
    );
    edge.set_size(tauri::LogicalSize::new(if popup { 336 } else { 56 }, 64))
        .map_err(|_| "WINDOW_UNAVAILABLE")?;
    edge.set_position(tauri::PhysicalPosition::new(x, y))
        .map_err(|_| "WINDOW_UNAVAILABLE")?;
    Ok(())
}
fn position_chat_at_edge(app: &tauri::AppHandle) -> Result<(), String> {
    let main = app.get_webview_window("main").ok_or("WINDOW_UNAVAILABLE")?;
    let edge = app.get_webview_window("edge").ok_or("WINDOW_UNAVAILABLE")?;
    let monitor = edge
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| main.primary_monitor().ok().flatten())
        .ok_or("MONITOR_UNAVAILABLE")?;
    let area = monitor.work_area();
    let c = config(app);
    let scale = monitor.scale_factor();
    let data = app
        .state::<CompanionState>()
        .stored
        .lock()
        .unwrap()
        .chat_geometry
        .clone();
    let width = data
        .as_ref()
        .map(|g| g.width)
        .unwrap_or(520)
        .clamp(460, 900)
        .min((area.size.width as f64 / scale) as u32);
    let height = data
        .as_ref()
        .map(|g| g.height)
        .unwrap_or(740)
        .clamp(580, 1100)
        .min((area.size.height as f64 / scale) as u32);
    main.set_size(tauri::LogicalSize::new(width, height))
        .map_err(|_| "WINDOW_UNAVAILABLE")?;
    let x = if c.edge_side == "right" {
        area.position.x + area.size.width as i32 - (width as f64 * scale) as i32
    } else {
        area.position.x
    };
    let y = area.position.y
        + (((area.size.height as f64 - height as f64 * scale).max(0.0)) * c.edge_vertical) as i32;
    main.set_position(tauri::PhysicalPosition::new(x, y))
        .map_err(|_| "WINDOW_UNAVAILABLE")?;
    Ok(())
}
pub fn set_surface(app: &tauri::AppHandle, next: Surface) -> Result<(), String> {
    let state = app.state::<PresenceState>();
    let previous = *state.surface.lock().map_err(|_| "STATE_UNAVAILABLE")?;
    let main = app.get_webview_window("main").ok_or("WINDOW_UNAVAILABLE")?;
    let edge = app.get_webview_window("edge").ok_or("WINDOW_UNAVAILABLE")?;
    if previous == Surface::Chat && next != Surface::Chat {
        super::companion_commands::remember_geometry(app);
    }
    match next {
        Surface::Hidden => {
            let _ = main.hide();
            let _ = edge.hide();
        }
        Surface::Edge => {
            let _ = main.hide();
            position_edge(app, false)?;
            edge.show().map_err(|_| "WINDOW_UNAVAILABLE")?;
        }
        Surface::Chat => {
            if matches!(previous, Surface::Edge | Surface::Hidden) {
                position_chat_at_edge(app)?;
            } else if previous == Surface::Agent {
                let data = app
                    .state::<CompanionState>()
                    .stored
                    .lock()
                    .unwrap()
                    .chat_geometry
                    .clone();
                if let Some(g) = data {
                    let _ = main.set_size(tauri::LogicalSize::new(
                        g.width.clamp(460, 900),
                        g.height.clamp(580, 1100),
                    ));
                    let _ = main.set_position(tauri::PhysicalPosition::new(g.x, g.y));
                }
            }
            let _ = edge.hide();
            #[cfg(target_os = "macos")]
            let _ = app.show();
            let _ = main.show();
            let _ = main.set_focus();
        }
        Surface::Agent => {
            if previous != Surface::Agent {
                let _ = main.set_size(tauri::LogicalSize::new(1180, 820));
                let _ = main.center();
            }
            let _ = edge.hide();
            #[cfg(target_os = "macos")]
            let _ = app.show();
            let _ = main.show();
            let _ = main.set_focus();
        }
    }
    *state.surface.lock().map_err(|_| "STATE_UNAVAILABLE")? = next;
    *app.state::<CompanionState>().agent_mode.lock().unwrap() = next == Surface::Agent;
    notify(app);
    Ok(())
}
#[tauri::command]
pub fn presence_action(app: tauri::AppHandle, action: String) -> Result<(), String> {
    let next = match action.as_str() {
        "edge" => Surface::Edge,
        "hidden" => Surface::Hidden,
        "chat" => Surface::Chat,
        "agent" => Surface::Agent,
        "dismiss" => {
            app.state::<PresenceState>().reminder.lock().unwrap().take();
            if *app.state::<PresenceState>().surface.lock().unwrap() == Surface::Edge {
                position_edge(&app, false)?;
            }
            notify(&app);
            return Ok(());
        }
        _ => return Err("INVALID_WINDOW_ACTION".into()),
    };
    set_surface(&app, next)?;
    if next == Surface::Chat {
        let _ = app.emit_to("main", "ordibot:navigate", "chat");
    }
    if next == Surface::Agent {
        let _ = app.emit_to("main", "ordibot:navigate", "agent");
    }
    Ok(())
}
#[tauri::command]
pub fn context_accept(app: tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<PresenceState>();
    let context = state
        .reminder
        .lock()
        .map_err(|_| "STATE_UNAVAILABLE")?
        .take()
        .or_else(|| state.latest.lock().ok()?.clone())
        .ok_or("CONTEXT_UNAVAILABLE")?;
    set_surface(&app, Surface::Chat)?;
    let _ = app.emit_to("main", "ordibot:navigate", "chat");
    let _ = app.emit_to("main", "ordibot:context-accepted", context);
    notify(&app);
    Ok(())
}
// Pointer-captured movement avoids platform-specific native drag timing and never executes tools.
#[tauri::command]
pub fn surface_drag(
    app: tauri::AppHandle,
    window: tauri::WebviewWindow,
    phase: String,
    dx: f64,
    dy: f64,
) -> Result<(), String> {
    if !matches!(window.label(), "main" | "edge")
        || !dx.is_finite()
        || !dy.is_finite()
        || dx.abs() > 10000.0
        || dy.abs() > 10000.0
    {
        return Err("INVALID_WINDOW_ACTION".into());
    }
    let state = app.state::<PresenceState>();
    match phase.as_str() {
        "start" => {
            if window.label() == "edge" {
                state.reminder.lock().unwrap().take();
                position_edge(&app, false)?;
                notify(&app);
            }
            let p = window.outer_position().map_err(|_| "WINDOW_UNAVAILABLE")?;
            let scale = window.scale_factor().map_err(|_| "WINDOW_UNAVAILABLE")?;
            *state.drag.lock().unwrap() = Some((window.label().into(), p.x, p.y, scale));
        }
        "move" => {
            if let Some((label, x, y, scale)) = state.drag.lock().unwrap().clone() {
                if label != window.label() {
                    return Err("INVALID_WINDOW_ACTION".into());
                }
                window
                    .set_position(tauri::PhysicalPosition::new(
                        x + (dx * scale).round() as i32,
                        y + (dy * scale).round() as i32,
                    ))
                    .map_err(|_| "WINDOW_UNAVAILABLE")?;
            }
        }
        "end" => {
            *state.drag.lock().unwrap() = None;
            if window.label() == "edge" {
                let p = window.outer_position().map_err(|_| "WINDOW_UNAVAILABLE")?;
                let m = window
                    .current_monitor()
                    .ok()
                    .flatten()
                    .or_else(|| window.primary_monitor().ok().flatten())
                    .ok_or("MONITOR_UNAVAILABLE")?;
                let a = m.work_area();
                let scale = m.scale_factor();
                let side =
                    if (p.x - a.position.x) as f64 + 28.0 * scale < (a.size.width as f64 / 2.0) {
                        "left"
                    } else {
                        "right"
                    };
                let vertical = ((p.y - a.position.y) as f64
                    / (a.size.height as f64 - 64.0 * scale).max(1.0))
                .clamp(0.0, 1.0);
                let data = app.state::<CompanionState>();
                let mut stored = data.stored.lock().unwrap();
                stored.config.edge_side = side.into();
                stored.config.edge_vertical = vertical;
                data.persist(&stored)?;
                drop(stored);
                position_edge(&app, false)?;
                notify(&app);
            } else {
                super::companion_commands::remember_geometry(&app);
            }
        }
        _ => return Err("INVALID_WINDOW_ACTION".into()),
    }
    Ok(())
}
pub fn start_awareness(app: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        let start = std::time::Instant::now();
        let mut tracker = ReminderTracker::default();
        let mut expires: Option<u64> = None;
        loop {
            tokio::time::sleep(std::time::Duration::from_secs(3)).await;
            let c = config(&app);
            let mode = *app.state::<PresenceState>().surface.lock().unwrap();
            let seconds = start.elapsed().as_secs();
            if !c.context_reminders || mode == Surface::Hidden {
                tracker = ReminderTracker::default();
                expires = None;
                if app
                    .state::<PresenceState>()
                    .reminder
                    .lock()
                    .unwrap()
                    .take()
                    .is_some()
                {
                    notify(&app);
                    if mode == Surface::Edge {
                        let _ = position_edge(&app, false);
                    }
                }
                continue;
            }
            if expires.is_some_and(|at| seconds >= at) {
                app.state::<PresenceState>().reminder.lock().unwrap().take();
                expires = None;
                notify(&app);
                if mode == Surface::Edge {
                    let _ = position_edge(&app, false);
                }
            }
            // Only app name and window title. This never calls clipboard/screenshot or provider code.
            let Ok(context) =
                tauri::async_runtime::spawn_blocking(super::companion_platform::active_context)
                    .await
            else {
                continue;
            };
            if !context.available
                || self_app(&context.app)
                || (c.browsers_editors_only && !browser_or_editor(&context.app))
            {
                continue;
            }
            *app.state::<PresenceState>().latest.lock().unwrap() = Some(context.clone());
            if let Some(next) = tracker.observe(context, seconds) {
                *app.state::<PresenceState>().reminder.lock().unwrap() = Some(next);
                expires = Some(seconds + 10);
                if mode == Surface::Edge {
                    let _ = position_edge(&app, true);
                }
                notify(&app);
            }
        }
    });
}

pub fn refresh_preferences(app: &tauri::AppHandle) {
    let c = config(app);
    if !c.context_reminders {
        app.state::<PresenceState>().reminder.lock().unwrap().take();
    }
    if *app.state::<PresenceState>().surface.lock().unwrap() == Surface::Edge {
        let popup = app
            .state::<PresenceState>()
            .reminder
            .lock()
            .unwrap()
            .is_some();
        let _ = position_edge(app, popup);
    }
    notify(app);
}
