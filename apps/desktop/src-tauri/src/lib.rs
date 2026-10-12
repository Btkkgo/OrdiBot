mod companion_commands;
mod companion_platform;
mod companion_remote;
mod companion_store;
use companion_store::CompanionState;
use tauri::{Emitter, Manager};

pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _, event| {
                    if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        companion_commands::show_main(app);
                    }
                })
                .build(),
        )
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&dir)?;
            let state =
                CompanionState::load(dir.join("ordibot-v1.json")).map_err(std::io::Error::other)?;
            let data = state.stored.lock().unwrap().clone();
            app.manage(state);
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.set_always_on_top(data.config.always_on_top);
                if let Some(g) = data.chat_geometry {
                    let _ = w.set_size(tauri::LogicalSize::new(
                        g.width.clamp(460, 900),
                        g.height.clamp(580, 1100),
                    ));
                    let _ = w.set_position(tauri::PhysicalPosition::new(g.x, g.y));
                }
                let handle = app.handle().clone();
                w.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        companion_commands::remember_geometry(&handle);
                        if let Some(w) = handle.get_webview_window("main") {
                            let _ = w.hide();
                        }
                    }
                });
            }
            let show =
                tauri::menu::MenuItem::with_id(app, "show", "Open OrdiBot", true, None::<&str>)?;
            let agent = tauri::menu::MenuItem::with_id(
                app,
                "agent",
                "Agent Workspace",
                true,
                None::<&str>,
            )?;
            let quit =
                tauri::menu::MenuItem::with_id(app, "quit", "Quit OrdiBot", true, None::<&str>)?;
            let menu = tauri::menu::Menu::with_items(app, &[&show, &agent, &quit])?;
            let mut tray = tauri::tray::TrayIconBuilder::new()
                .tooltip("OrdiBot · Your Desktop AI Companion")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => companion_commands::show_main(app),
                    "agent" => {
                        companion_commands::show_main(app);
                        let _ = app.emit("ordibot:navigate", "agent");
                    }
                    "quit" => {
                        companion_commands::remember_geometry(app);
                        app.exit(0);
                    }
                    _ => {}
                });
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.build(app)?;
            use tauri_plugin_global_shortcut::GlobalShortcutExt;
            let available = app
                .global_shortcut()
                .register("CommandOrControl+Shift+Space")
                .is_ok();
            *app.state::<CompanionState>()
                .shortcut_available
                .lock()
                .unwrap() = available;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            companion_commands::companion_snapshot,
            companion_commands::save_companion_config,
            companion_commands::chat_send,
            companion_commands::chat_cancel,
            companion_commands::window_action,
            companion_commands::open_service,
            companion_platform::attach_clipboard,
            companion_platform::desktop_context,
            companion_platform::capture_screen,
            companion_remote::remote_submit,
            companion_remote::remote_refresh,
            companion_remote::remote_control
        ])
        .build(tauri::generate_context!())
        .expect("failed to build OrdiBot")
        .run(|app, event| {
            if matches!(event, tauri::RunEvent::ExitRequested { .. }) {
                companion_commands::remember_geometry(app);
            }
            #[cfg(target_os = "macos")]
            if matches!(event, tauri::RunEvent::Reopen { .. }) {
                companion_commands::show_main(app);
            }
        });
}
