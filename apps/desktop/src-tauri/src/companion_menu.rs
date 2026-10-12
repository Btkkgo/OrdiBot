use tauri::{
    Manager,
    menu::{Menu, MenuItem},
};
pub struct CompanionMenu(pub Vec<MenuItem<tauri::Wry>>);
fn labels(language: &str) -> Result<[&'static str; 5], String> {
    match language {
        "zh-CN" => Ok([
            "打开 OrdiBot",
            "边缘宠物",
            "Agent 工作台",
            "隐藏 OrdiBot",
            "退出 OrdiBot",
        ]),
        "en" => Ok([
            "Open OrdiBot",
            "Edge Pet",
            "Agent Workspace",
            "Hide OrdiBot",
            "Quit OrdiBot",
        ]),
        _ => Err("INVALID_APPEARANCE_SETTINGS".into()),
    }
}
pub fn create(
    app: &tauri::App,
    language: &str,
) -> Result<Menu<tauri::Wry>, Box<dyn std::error::Error>> {
    let items = ["show", "edge", "agent", "hidden", "quit"]
        .into_iter()
        .zip(labels(language)?)
        .map(|(id, label)| MenuItem::with_id(app, id, label, true, None::<&str>))
        .collect::<Result<Vec<_>, _>>()?;
    let menu = Menu::with_items(
        app,
        &[&items[0], &items[1], &items[2], &items[3], &items[4]],
    )?;
    app.manage(CompanionMenu(items));
    Ok(menu)
}
#[tauri::command]
pub fn preview_ui_language(app: tauri::AppHandle, language: String) -> Result<(), String> {
    let labels = labels(&language)?;
    for (item, label) in app.state::<CompanionMenu>().0.iter().zip(labels) {
        item.set_text(label).map_err(|_| "WINDOW_UNAVAILABLE")?;
    }
    Ok(())
}
