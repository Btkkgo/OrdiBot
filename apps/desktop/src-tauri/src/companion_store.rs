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
    pub model_parameters: model_gateway::ChatParameterPolicy,
    pub style: String,
    pub always_on_top: bool,
    pub remote_model: String,
    pub context_reminders: bool,
    pub browsers_editors_only: bool,
    pub edge_side: String,
    pub edge_vertical: f64,
    pub language: String,
    pub font_scale: u16,
    pub accent_color: String,
    pub background_style: String,
}
impl Default for Config {
    fn default() -> Self {
        Self {
            provider: "OpenAI-compatible".into(),
            base_url: "https://api.openai.com/v1".into(),
            model: String::new(),
            vision: false,
            output_length: 1024,
            model_parameters: Default::default(),
            style: "concise".into(),
            always_on_top: true,
            remote_model: "gpt-6-astra".into(),
            context_reminders: true,
            browsers_editors_only: false,
            edge_side: "left".into(),
            edge_vertical: 0.5,
            language: "zh-CN".into(),
            font_scale: 100,
            accent_color: "purple".into(),
            background_style: "graphite".into(),
        }
    }
}
impl Config {
    pub fn validate(&self) -> Result<(), String> {
        if !matches!(self.language.as_str(), "zh-CN" | "en")
            || ![90, 100, 110, 120, 130].contains(&self.font_scale)
            || !matches!(
                self.accent_color.as_str(),
                "purple" | "blue" | "teal" | "amber" | "rose"
            )
            || !matches!(
                self.background_style.as_str(),
                "graphite" | "midnight" | "warm-charcoal"
            )
        {
            return Err("INVALID_APPEARANCE_SETTINGS".into());
        }
        model_gateway::ModelEndpoint::parse(&self.base_url).map_err(|_| "INVALID_BASE_URL")?;
        if self.provider.trim().is_empty()
            || self.provider.len() > 200
            || self.provider.chars().any(char::is_control)
        {
            return Err("INVALID_MODEL_SETTINGS".into());
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
    pub chat_credential: Option<super::companion_credentials::ChatCredential>,
    pub remote_credential: Option<String>,
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
    use super::super::companion_credentials::{CredentialVault, chat_key_for, save_settings};
    use super::*;
    use std::cell::{Cell, RefCell};
    struct FixtureVault {
        values: RefCell<std::collections::BTreeMap<String, String>>,
        fail: Cell<bool>,
        fail_remote: Cell<bool>,
        reads: Cell<usize>,
    }
    impl FixtureVault {
        fn new() -> Self {
            Self {
                values: RefCell::new(Default::default()),
                fail: Cell::new(false),
                fail_remote: Cell::new(false),
                reads: Cell::new(0),
            }
        }
    }
    impl CredentialVault for FixtureVault {
        fn write_new(&self, account: &str, value: &str) -> Result<(), String> {
            if self.fail.get() || (self.fail_remote.get() && account.starts_with("remote-v2-")) {
                return Err("SECURE_STORAGE_UNAVAILABLE".into());
            }
            assert!(!self.values.borrow().contains_key(account));
            self.values
                .borrow_mut()
                .insert(account.into(), value.into());
            Ok(())
        }
        fn read(&self, account: &str) -> Result<Option<String>, String> {
            self.reads.set(self.reads.get() + 1);
            Ok(self.values.borrow().get(account).cloned())
        }
    }
    #[test]
    fn bound_credentials_follow_identity_not_model_and_local_never_reads_keys() {
        let d = tempfile::tempdir().unwrap();
        let state = CompanionState::load(d.path().join("state.json")).unwrap();
        let vault = FixtureVault::new();
        let mut config = Config::default();
        config.model = "fixture".into();
        save_settings(&state, config.clone(), Some("fixture-a"), None, &vault).unwrap();
        let original = state.stored.lock().unwrap().clone();
        assert!(chat_key_for(&original, &vault).unwrap().is_some());
        config.model = "other-model".into();
        save_settings(&state, config.clone(), None, None, &vault).unwrap();
        assert!(
            chat_key_for(&state.stored.lock().unwrap(), &vault)
                .unwrap()
                .is_some()
        );
        config.base_url = "https://other.example/v1".into();
        save_settings(&state, config.clone(), None, None, &vault).unwrap();
        assert!(
            chat_key_for(&state.stored.lock().unwrap(), &vault)
                .unwrap()
                .is_none()
        );
        assert_eq!(vault.reads.get(), 2);
        let mut local = original.clone();
        local.config.base_url = "http://[::1]:11434/v1".into();
        assert!(chat_key_for(&local, &vault).unwrap().is_none());
        assert_eq!(vault.reads.get(), 2);
        let mut renamed = original.clone();
        renamed.config.provider = "another-provider".into();
        assert!(chat_key_for(&renamed, &vault).unwrap().is_none());
        assert_eq!(vault.reads.get(), 2);
        assert!(
            vault
                .values
                .borrow()
                .values()
                .any(|v| v.contains("fixture-a"))
        );
        for url in [
            "https://api.openai.com:8443/v1",
            "https://api.openai.com/v2",
            "https://api.openai.com/v1/other",
        ] {
            let mut changed = original.clone();
            changed.config.base_url = url.into();
            assert!(chat_key_for(&changed, &vault).unwrap().is_none());
        }
        let mut equivalent = original.clone();
        equivalent.config.provider = " OPENAI-COMPATIBLE ".into();
        equivalent.config.base_url = "https://API.OPENAI.COM:443/v1/".into();
        assert!(chat_key_for(&equivalent, &vault).unwrap().is_some());
    }
    #[test]
    fn edited_json_cannot_rebind_an_existing_secure_slot() {
        let d = tempfile::tempdir().unwrap();
        let state = CompanionState::load(d.path().join("state.json")).unwrap();
        let vault = FixtureVault::new();
        save_settings(&state, Config::default(), Some("fixture-a"), None, &vault).unwrap();
        let mut forged = state.stored.lock().unwrap().clone();
        forged.config.base_url = "https://other.example/v1".into();
        forged.chat_credential.as_mut().unwrap().identity = serde_json::to_string(&(
            forged.config.provider.trim().to_lowercase(),
            forged.config.base_url.clone(),
        ))
        .unwrap();
        assert!(chat_key_for(&forged, &vault).unwrap().is_none());
    }
    #[test]
    fn failed_saves_preserve_committed_config_binding_and_existing_slots() {
        let d = tempfile::tempdir().unwrap();
        let path = d.path().join("state.json");
        let state = CompanionState::load(path.clone()).unwrap();
        let vault = FixtureVault::new();
        let config = Config {
            model_parameters: model_gateway::ChatParameterPolicy::Completion,
            ..Default::default()
        };
        save_settings(
            &state,
            config,
            Some("fixture-a"),
            Some("fixture-remote"),
            &vault,
        )
        .unwrap();
        let before = std::fs::read(&path).unwrap();
        let old = serde_json::to_value(&*state.stored.lock().unwrap()).unwrap();
        let restored = CompanionState::load(path.clone()).unwrap();
        assert_eq!(
            serde_json::to_value(&*restored.stored.lock().unwrap()).unwrap(),
            old
        );
        assert!(
            chat_key_for(&restored.stored.lock().unwrap(), &vault)
                .unwrap()
                .is_some()
        );
        assert!(
            !String::from_utf8(before.clone())
                .unwrap()
                .contains("fixture-a")
        );
        assert!(
            !String::from_utf8(before.clone())
                .unwrap()
                .contains("fixture-remote")
        );
        let mut changed = Config::default();
        changed.provider = "changed".into();
        vault.fail.set(true);
        assert!(save_settings(&state, changed.clone(), Some("fixture-b"), None, &vault).is_err());
        assert_eq!(std::fs::read(&path).unwrap(), before);
        assert_eq!(
            serde_json::to_value(&*state.stored.lock().unwrap()).unwrap(),
            old
        );
        vault.fail.set(false);
        vault.fail_remote.set(true);
        assert!(
            save_settings(
                &state,
                changed.clone(),
                Some("fixture-b"),
                Some("fixture-new-remote"),
                &vault
            )
            .is_err()
        );
        assert_eq!(std::fs::read(&path).unwrap(), before);
        assert_eq!(
            serde_json::to_value(&*state.stored.lock().unwrap()).unwrap(),
            old
        );
        vault.fail_remote.set(false);
        let mut broken = CompanionState::load(d.path().join("unused.json")).unwrap();
        *broken.stored.lock().unwrap() = state.stored.lock().unwrap().clone();
        broken.file = d.path().join("absent").join("state.json");
        assert!(
            save_settings(
                &broken,
                changed,
                Some("fixture-b"),
                Some("fixture-new-remote"),
                &vault
            )
            .is_err()
        );
        assert_eq!(
            serde_json::to_value(&*broken.stored.lock().unwrap()).unwrap(),
            old
        );
        assert!(
            chat_key_for(&broken.stored.lock().unwrap(), &vault)
                .unwrap()
                .is_some()
        );
        assert!(
            vault
                .values
                .borrow()
                .values()
                .any(|v| v == "fixture-remote")
        );
    }
    #[test]
    fn unbound_legacy_credentials_are_not_read_or_adopted_and_local_key_save_is_rejected() {
        let d = tempfile::tempdir().unwrap();
        let state = CompanionState::load(d.path().join("state.json")).unwrap();
        let vault = FixtureVault::new();
        assert!(
            chat_key_for(&state.stored.lock().unwrap(), &vault)
                .unwrap()
                .is_none()
        );
        assert_eq!(vault.reads.get(), 0);
        let mut local = Config::default();
        local.base_url = "http://localhost:11434/v1".into();
        assert!(save_settings(&state, local.clone(), Some("fixture-cloud"), None, &vault).is_err());
        assert!(vault.values.borrow().is_empty());
        save_settings(&state, local, None, None, &vault).unwrap();
        assert!(
            chat_key_for(&state.stored.lock().unwrap(), &vault)
                .unwrap()
                .is_none()
        );
        assert_eq!(vault.reads.get(), 0);
    }
    #[test]
    fn legacy_store_gets_appearance_defaults_without_losing_user_data() {
        let old = serde_json::json!({
            "config":{"model":"existing-model","edgeSide":"right","edgeVertical":0.73,"style":"detailed"},
            "conversations":[{"id":"c","title":"用户原文","messages":[{"role":"user","content":"untouched 内容","createdAt":"2026-10-12"}]}],
            "tasks":[{"id":"t","objective":"Original objective","sessionId":null,"status":"completed","createdAt":"2026-10-12","updatedAt":"2026-10-12","items":[{"type":"message","text":"Provider 原文"}],"requiredActions":[],"result":"Raw result","error":null}],
            "chatGeometry":{"x":100,"y":200,"width":600,"height":850}
        });
        let stored: Stored = serde_json::from_value(old.clone()).unwrap();
        let migrated = serde_json::to_value(&stored).unwrap();
        assert_eq!(migrated["config"]["language"], "zh-CN");
        assert_eq!(migrated["config"]["fontScale"], 100);
        assert_eq!(migrated["config"]["accentColor"], "purple");
        assert_eq!(migrated["config"]["backgroundStyle"], "graphite");
        for field in ["conversations", "tasks", "chatGeometry"] {
            assert_eq!(migrated[field], old[field]);
        }
        assert_eq!(migrated["config"]["edgeVertical"], 0.73);
        assert_eq!(migrated["config"]["model"], "existing-model");
        assert_eq!(migrated["config"]["modelParameters"], "standard");
        assert!(stored.chat_credential.is_none());
        let d = tempfile::tempdir().unwrap();
        let path = d.path().join("state.json");
        let state = CompanionState::load(path.clone()).unwrap();
        state.persist(&stored).unwrap();
        assert_eq!(
            serde_json::to_value(
                CompanionState::load(path)
                    .unwrap()
                    .stored
                    .into_inner()
                    .unwrap()
            )
            .unwrap(),
            migrated
        );
    }
    #[test]
    fn appearance_presets_validate_and_survive_restart() {
        for (field, values) in [
            (
                "language",
                vec![serde_json::json!("zh-CN"), serde_json::json!("en")],
            ),
            (
                "fontScale",
                vec![90.into(), 100.into(), 110.into(), 120.into(), 130.into()],
            ),
            (
                "accentColor",
                vec![
                    "purple".into(),
                    "blue".into(),
                    "teal".into(),
                    "amber".into(),
                    "rose".into(),
                ],
            ),
            (
                "backgroundStyle",
                vec!["graphite".into(), "midnight".into(), "warm-charcoal".into()],
            ),
        ] {
            for value in values {
                let mut json = serde_json::to_value(Config::default()).unwrap();
                json[field] = value.clone();
                let config: Config = serde_json::from_value(json).unwrap();
                assert!(config.validate().is_ok());
                assert_eq!(serde_json::to_value(config).unwrap()[field], value);
            }
        }
    }
    #[test]
    fn invalid_appearance_is_rejected_on_save() {
        for (field, value) in [
            ("language", serde_json::json!("fr")),
            ("fontScale", 135.into()),
            ("accentColor", "red".into()),
            ("backgroundStyle", "white".into()),
        ] {
            let mut json = serde_json::to_value(Config::default()).unwrap();
            json[field] = value;
            let config: Config = serde_json::from_value(json).unwrap();
            assert_eq!(config.validate(), Err("INVALID_APPEARANCE_SETTINGS".into()));
        }
    }
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
