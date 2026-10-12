mod companion_commands;
mod companion_menu;
mod companion_platform;
mod companion_presence;
mod companion_remote;
mod companion_store;
use companion_store::CompanionState;
use tauri::Manager;

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
            app.manage(companion_presence::PresenceState::default());
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
                        let _ = companion_presence::set_surface(
                            &handle,
                            companion_presence::Surface::Edge,
                        );
                    }
                });
            }
            let menu = companion_menu::create(app, &data.config.language)?;
            let mut tray = tauri::tray::TrayIconBuilder::new()
                .tooltip("OrdiBot · Your Desktop AI Companion")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => companion_commands::show_main(app),
                    "edge" => {
                        let _ =
                            companion_presence::set_surface(app, companion_presence::Surface::Edge);
                    }
                    "hidden" => {
                        let _ = companion_presence::set_surface(
                            app,
                            companion_presence::Surface::Hidden,
                        );
                    }
                    "agent" => {
                        let _ = companion_presence::presence_action(app.clone(), "agent".into());
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
            companion_presence::set_surface(app.handle(), companion_presence::Surface::Edge)
                .map_err(std::io::Error::other)?;
            companion_presence::start_awareness(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            companion_menu::preview_ui_language,
            companion_presence::presence_snapshot,
            companion_presence::presence_action,
            companion_presence::context_accept,
            companion_presence::surface_drag,
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
