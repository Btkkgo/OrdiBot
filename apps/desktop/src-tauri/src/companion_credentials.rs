use super::companion_store::{CompanionState, Config, Stored};
use model_gateway::ModelEndpoint;
use serde::{Deserialize, Serialize};

const SERVICE: &str = "ai.ordibot.desktop.model-provider";

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatCredential {
    pub identity: String,
    pub account: String,
}
// The trusted identity lives with the secret, not only in editable settings JSON.
#[derive(Serialize, Deserialize)]
struct BoundSecret {
    identity: String,
    key: String,
}

pub trait CredentialVault {
    fn write_new(&self, account: &str, value: &str) -> Result<(), String>;
    fn read(&self, account: &str) -> Result<Option<String>, String>;
}
pub struct SystemVault;
impl CredentialVault for SystemVault {
    fn write_new(&self, account: &str, value: &str) -> Result<(), String> {
        // Every write targets a new UUID slot. Never overwrite/import legacy slots.
        keyring::Entry::new(SERVICE, account)
            .and_then(|e| e.set_password(value))
            .map_err(|_| "SECURE_STORAGE_UNAVAILABLE".into())
    }
    fn read(&self, account: &str) -> Result<Option<String>, String> {
        match keyring::Entry::new(SERVICE, account).and_then(|e| e.get_password()) {
            Ok(value) => Ok(Some(value)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(_) => Err("SECURE_STORAGE_UNAVAILABLE".into()),
        }
    }
}
fn identity(config: &Config) -> Result<String, String> {
    let endpoint = ModelEndpoint::parse(&config.base_url).map_err(|_| "INVALID_BASE_URL")?;
    serde_json::to_string(&(config.provider.trim().to_lowercase(), endpoint.canonical))
        .map_err(|_| "INVALID_MODEL_SETTINGS".into())
}
fn valid_slot(account: &str, prefix: &str) -> bool {
    account
        .strip_prefix(prefix)
        .and_then(|s| uuid::Uuid::parse_str(s).ok())
        .is_some()
}
pub fn chat_key_for(
    stored: &Stored,
    vault: &impl CredentialVault,
) -> Result<Option<String>, String> {
    let endpoint = ModelEndpoint::parse(&stored.config.base_url).map_err(|_| "INVALID_BASE_URL")?;
    // Local requests do not even read a cloud credential.
    if endpoint.local {
        return Ok(None);
    }
    let Some(binding) = &stored.chat_credential else {
        return Ok(None);
    };
    if binding.identity != identity(&stored.config)? || !valid_slot(&binding.account, "chat-v2-") {
        return Ok(None);
    }
    let Some(value) = vault.read(&binding.account)? else {
        return Ok(None);
    };
    let secret: BoundSecret =
        serde_json::from_str(&value).map_err(|_| "SECURE_STORAGE_UNAVAILABLE")?;
    Ok((secret.identity == binding.identity).then_some(secret.key))
}
pub fn remote_key_for(stored: &Stored) -> Result<Option<String>, String> {
    match &stored.remote_credential {
        Some(account) if valid_slot(account, "remote-v2-") => SystemVault.read(account),
        Some(_) => Err("SECURE_STORAGE_UNAVAILABLE".into()),
        None => super::companion_store::read_key(true), // Preserve existing Remote behavior.
    }
}

/// Immutable key slots + a single atomic JSON pointer commit avoid a dual-store rollback.
/// Failed/crashed staging may retain unreferenced new slots; existing slots are never changed.
pub fn save_settings(
    state: &CompanionState,
    config: Config,
    key: Option<&str>,
    remote_key: Option<&str>,
    vault: &impl CredentialVault,
) -> Result<(), String> {
    config.validate()?;
    let endpoint = ModelEndpoint::parse(&config.base_url).map_err(|_| "INVALID_BASE_URL")?;
    let key = key.map(str::trim).filter(|s| !s.is_empty());
    let remote_key = remote_key.map(str::trim).filter(|s| !s.is_empty());
    if endpoint.local && key.is_some() {
        return Err("LOCAL_ENDPOINT_KEY_FORBIDDEN".into());
    }
    let mut current = state.stored.lock().map_err(|_| "STATE_UNAVAILABLE")?;
    let mut next = current.clone();
    next.config = config;
    let expected = identity(&next.config)?;
    if endpoint.local
        || next
            .chat_credential
            .as_ref()
            .is_some_and(|b| b.identity != expected)
    {
        next.chat_credential = None;
    }
    if let Some(value) = key {
        let account = format!("chat-v2-{}", uuid::Uuid::now_v7());
        let secret = serde_json::to_string(&BoundSecret {
            identity: expected.clone(),
            key: value.into(),
        })
        .map_err(|_| "SECURE_STORAGE_UNAVAILABLE")?;
        vault.write_new(&account, &secret)?;
        next.chat_credential = Some(ChatCredential {
            identity: expected,
            account,
        });
    }
    if let Some(value) = remote_key {
        let account = format!("remote-v2-{}", uuid::Uuid::now_v7());
        vault.write_new(&account, value)?;
        next.remote_credential = Some(account);
    }
    state.persist(&next)?;
    *current = next;
    Ok(())
}
