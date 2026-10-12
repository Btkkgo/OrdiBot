use serde::{Deserialize, Serialize};
use std::{path::PathBuf, sync::Mutex};
use tokio::sync::watch;

pub const SYSTEM_PROMPT: &str = "You are OrdiBot, a concise desktop context assistant. Answer the user's actual question directly. When context is provided, ground your answer in that context. Prefer 1–3 sentences for ordinary questions. Do not start independent research or lengthy explanations unless requested. Never claim to have observed a screen, file or application you have not actually accessed.";

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Config {
    pub provider: String,
    pub base_url: String,
    pub model: String,
    pub vision: bool,
    pub output_length: u32,
    pub style: String,
    pub always_on_top: bool,
    pub remote_model: String,
    pub context_reminders: bool,
    pub browsers_editors_only: bool,
    pub edge_side: String,
    pub edge_vertical: f64,
}
impl Default for Config {
    fn default() -> Self {
        Self {
            provider: "OpenAI-compatible".into(),
            base_url: "https://api.openai.com/v1".into(),
            model: String::new(),
            vision: false,
            output_length: 1024,
            style: "concise".into(),
            always_on_top: true,
            remote_model: "gpt-6-astra".into(),
            context_reminders: true,
            browsers_editors_only: false,
            edge_side: "left".into(),
            edge_vertical: 0.5,
        }
    }
}
impl Config {
    pub fn validate(&self) -> Result<(), String> {
        let url = reqwest::Url::parse(&self.base_url).map_err(|_| "INVALID_BASE_URL")?;
        if (url.scheme() != "https"
            && !(url.scheme() == "http"
                && matches!(url.host_str(), Some("localhost" | "127.0.0.1" | "[::1]"))))
            || !url.username().is_empty()
            || url.password().is_some()
            || url.query().is_some()
            || url.fragment().is_some()
        {
            return Err("INVALID_BASE_URL".into());
        }
        if self.model.len() > 200
            || !(256..=8192).contains(&self.output_length)
            || !matches!(self.style.as_str(), "concise" | "normal" | "detailed")
            || !matches!(self.edge_side.as_str(), "left" | "right")
            || !self.edge_vertical.is_finite()
            || !(0.0..=1.0).contains(&self.edge_vertical)
        {
            return Err("INVALID_MODEL_SETTINGS".into());
        }
        Ok(())
    }
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Message {
    pub role: String,
    pub content: String,
    pub created_at: String,
    #[serde(default, skip_serializing)]
    pub images: Vec<String>,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Conversation {
    pub id: String,
    pub title: String,
    pub messages: Vec<Message>,
}
#[derive(Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct Geometry {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteTask {
    pub id: String,
    pub objective: String,
    pub session_id: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
    pub items: Vec<serde_json::Value>,
    pub required_actions: Vec<serde_json::Value>,
    pub result: String,
    pub error: Option<String>,
}
#[derive(Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct Stored {
    pub config: Config,
    pub conversations: Vec<Conversation>,
    pub tasks: Vec<RemoteTask>,
    pub chat_geometry: Option<Geometry>,
}
pub struct CompanionState {
    pub file: PathBuf,
    pub stored: Mutex<Stored>,
    pub cancel: Mutex<Option<watch::Sender<bool>>>,
    pub agent_mode: Mutex<bool>,
    pub shortcut_available: Mutex<bool>,
}
impl CompanionState {
    pub fn load(file: PathBuf) -> Result<Self, String> {
        let stored = if file.exists() {
            serde_json::from_slice(&std::fs::read(&file).map_err(|_| "SETTINGS_READ_FAILED")?)
                .map_err(|_| "SETTINGS_INVALID_PRESERVED")?
        } else {
            Stored::default()
        };
        Ok(Self {
            file,
            stored: Mutex::new(stored),
            cancel: Mutex::new(None),
            agent_mode: Mutex::new(false),
            shortcut_available: Mutex::new(false),
        })
    }
    pub fn persist(&self, stored: &Stored) -> Result<(), String> {
        let parent = self.file.parent().ok_or("SETTINGS_PATH_INVALID")?;
        let mut temp =
            tempfile::NamedTempFile::new_in(parent).map_err(|_| "SETTINGS_WRITE_FAILED")?;
        use std::io::Write;
        temp.write_all(&serde_json::to_vec_pretty(stored).map_err(|_| "SETTINGS_WRITE_FAILED")?)
            .map_err(|_| "SETTINGS_WRITE_FAILED")?;
        temp.as_file()
            .sync_all()
            .map_err(|_| "SETTINGS_WRITE_FAILED")?;
        temp.persist(&self.file)
            .map_err(|_| "SETTINGS_WRITE_FAILED")?;
        Ok(())
    }
}
pub fn key_entry(remote: bool) -> Result<keyring::Entry, String> {
    keyring::Entry::new(
        "ai.ordibot.desktop.model-provider",
        if remote { "remote-openai" } else { "chat" },
    )
    .map_err(|_| "SECURE_STORAGE_UNAVAILABLE".into())
}
pub fn read_key(remote: bool) -> Result<Option<String>, String> {
    match key_entry(remote)?.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(_) => Err("SECURE_STORAGE_UNAVAILABLE".into()),
    }
}
pub fn now() -> String {
    chrono::Utc::now().to_rfc3339()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn local_preferences_can_be_saved_before_model_configuration() {
        assert!(Config::default().validate().is_ok());
    }
    #[test]
    fn rejects_credential_urls_and_insecure_external_endpoints() {
        let mut c = Config {
            model: "model".into(),
            ..Default::default()
        };
        for url in [
            "http://example.com/v1",
            "https://user:secret@example.com/v1",
            "https://example.com/?key=secret",
        ] {
            c.base_url = url.into();
            assert!(c.validate().is_err())
        }
        c.base_url = "http://127.0.0.1:1234/v1".into();
        assert!(c.validate().is_ok());
    }
    #[test]
    fn snapshots_do_not_persist_screenshot_pixels() {
        let m = Message {
            role: "user".into(),
            content: "Question".into(),
            created_at: now(),
            images: vec!["private-image".into()],
        };
        assert!(!serde_json::to_string(&m).unwrap().contains("private-image"));
    }
    #[test]
    fn persistence_is_recoverable_and_corrupt_settings_are_preserved() {
        let d = tempfile::tempdir().unwrap();
        let file = d.path().join("state.json");
        let s = CompanionState::load(file.clone()).unwrap();
        s.persist(&Stored::default()).unwrap();
        assert!(CompanionState::load(file.clone()).is_ok());
        std::fs::write(&file, b"broken").unwrap();
        assert!(CompanionState::load(file.clone()).is_err());
        assert_eq!(std::fs::read(file).unwrap(), b"broken");
    }
}
