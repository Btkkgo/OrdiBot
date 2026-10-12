use super::companion_credentials::remote_key_for;
use super::companion_store::*;
use futures_util::StreamExt;
use serde_json::{Value, json};
use tauri::State;

fn client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .timeout(std::time::Duration::from_secs(45))
        .build()
        .map_err(|_| "REMOTE_NETWORK_ERROR".into())
}
async fn request(
    client: &reqwest::Client,
    key: &str,
    method: reqwest::Method,
    path: &str,
    body: Option<Value>,
) -> Result<Value, String> {
    let mut r = client
        .request(
            method,
            format!("https://api.openai.com/v1/agents/sessions{path}"),
        )
        .bearer_auth(key)
        .header("OpenAI-Beta", "agents=v1");
    if let Some(body) = body {
        r = r.json(&body);
    }
    let response = r.send().await.map_err(|_| "REMOTE_NETWORK_OR_TIMEOUT")?;
    if !response.status().is_success() {
        return Err(format!("REMOTE_HTTP_{}", response.status().as_u16()));
    }
    let mut bytes = Vec::new();
    let mut stream = response.bytes_stream();
    while let Some(b) = stream.next().await {
        let b = b.map_err(|_| "REMOTE_NETWORK_ERROR")?;
        if bytes.len() + b.len() > 4_000_000 {
            return Err("REMOTE_RESPONSE_TOO_LARGE".into());
        }
        bytes.extend_from_slice(&b);
    }
    if bytes.is_empty() {
        return Ok(json!({}));
    }
    serde_json::from_slice(&bytes).map_err(|_| "REMOTE_INVALID_RESPONSE".into())
}
fn valid_id(id: &str) -> bool {
    !id.is_empty()
        && id.len() <= 200
        && id
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || c == b'_' || c == b'-')
}
fn save_task(state: &CompanionState, task: &RemoteTask) -> Result<(), String> {
    let mut data = state.stored.lock().map_err(|_| "STATE_UNAVAILABLE")?;
    data.tasks.retain(|t| t.id != task.id);
    data.tasks.insert(0, task.clone());
    state.persist(&data)
}
fn get_task(state: &CompanionState, id: &str) -> Result<RemoteTask, String> {
    state
        .stored
        .lock()
        .map_err(|_| "STATE_UNAVAILABLE")?
        .tasks
        .iter()
        .find(|t| t.id == id)
        .cloned()
        .ok_or("TASK_NOT_FOUND".into())
}
#[tauri::command]
pub async fn remote_submit(
    state: State<'_, CompanionState>,
    objective: String,
) -> Result<RemoteTask, String> {
    if objective.trim().is_empty() || objective.len() > 20_000 {
        return Err("INVALID_TASK".into());
    }
    let key = remote_key_for(&*state.stored.lock().map_err(|_| "STATE_UNAVAILABLE")?)?
        .ok_or("REMOTE_KEY_NOT_CONFIGURED")?;
    let model = state
        .stored
        .lock()
        .map_err(|_| "STATE_UNAVAILABLE")?
        .config
        .remote_model
        .clone();
    if model.trim().is_empty() {
        return Err("REMOTE_MODEL_NOT_CONFIGURED".into());
    }
    let mut task = RemoteTask {
        id: uuid::Uuid::now_v7().to_string(),
        objective: objective.trim().into(),
        session_id: None,
        status: "submitting".into(),
        created_at: now(),
        updated_at: now(),
        items: Vec::new(),
        required_actions: Vec::new(),
        result: String::new(),
        error: None,
    };
    save_task(&state, &task)?;
    let body = json!({"agent":{"model":model,"instructions":"Perform the user's public-information task in the hosted browser. Read-only: do not sign in, purchase, send messages, publish, or modify website data. Report sources and actual results. Request browser origin approval when required.","tools":[{"type":"computer_use","include_screenshots":false}]},"environment":{"type":"openai_hosted","desktop":{"enabled":true},"network":{"access":"enabled"}},"input":objective});
    match request(&client()?, &key, reqwest::Method::POST, "", Some(body)).await {
        Ok(session) => {
            let id = session["id"].as_str().filter(|id| valid_id(id));
            if let Some(id) = id {
                task.session_id = Some(id.into());
                task.status = session["status"]
                    .as_str()
                    .unwrap_or("awaiting_provider")
                    .into();
            } else {
                task.status = "submission_unknown".into();
                task.error = Some("REMOTE_SESSION_ID_MISSING_OUTCOME_UNKNOWN".into());
            }
        }
        Err(e) => {
            task.status = if e.starts_with("REMOTE_HTTP_") {
                "failed"
            } else {
                "submission_unknown"
            }
            .into();
            task.error = Some(e);
        }
    }
    task.updated_at = now();
    save_task(&state, &task)?;
    Ok(task)
}
fn project_status(session: &Value, turns: &Value) -> String {
    if session["status"] == "failed" {
        return "failed".into();
    }
    if session["required_actions"]
        .as_array()
        .is_some_and(|a| !a.is_empty())
    {
        return "requires_action".into();
    }
    if let Some(turn) = turns["data"]
        .as_array()
        .and_then(|a| a.iter().find(|t| t["subagent_id"].is_null()))
    {
        if let Some(status) = turn["status"].as_str() {
            return status.into();
        }
    }
    // Idle/closed streams never manufacture a completed task.
    session["status"]
        .as_str()
        .unwrap_or("awaiting_provider")
        .into()
}
fn item_text(item: &Value) -> String {
    item["content"]
        .as_array()
        .map(|a| {
            a.iter()
                .filter_map(|p| p["text"].as_str())
                .collect::<Vec<_>>()
                .join("\n")
        })
        .or_else(|| item["text"].as_str().map(str::to_owned))
        .unwrap_or_default()
}
#[tauri::command]
pub async fn remote_refresh(
    state: State<'_, CompanionState>,
    task_id: String,
) -> Result<RemoteTask, String> {
    let mut task = get_task(&state, &task_id)?;
    let session = task
        .session_id
        .clone()
        .ok_or("REMOTE_SESSION_UNAVAILABLE")?;
    if !valid_id(&session) {
        return Err("INVALID_SESSION_ID".into());
    }
    let key = remote_key_for(&*state.stored.lock().map_err(|_| "STATE_UNAVAILABLE")?)?
        .ok_or("REMOTE_KEY_NOT_CONFIGURED")?;
    let client = client()?;
    let s = request(
        &client,
        &key,
        reqwest::Method::GET,
        &format!("/{session}"),
        None,
    )
    .await?;
    let turns = request(
        &client,
        &key,
        reqwest::Method::GET,
        &format!("/{session}/turns?order=desc&limit=20"),
        None,
    )
    .await?;
    let mut items = Vec::new();
    let mut after = String::new();
    loop {
        let page = request(
            &client,
            &key,
            reqwest::Method::GET,
            &format!("/{session}/items?order=asc&limit=100{after}"),
            None,
        )
        .await?;
        let data = page["data"].as_array().ok_or("REMOTE_INVALID_ITEMS")?;
        items.extend(data.iter().cloned());
        if page["has_more"] != true {
            break;
        }
        if items.len() >= 1000 {
            return Err("REMOTE_HISTORY_LIMIT_REACHED".into());
        }
        let cursor = page["last_id"]
            .as_str()
            .filter(|v| valid_id(v))
            .ok_or("REMOTE_INVALID_CURSOR")?;
        let next = format!("&after={cursor}");
        if next == after {
            return Err("REMOTE_CURSOR_STALLED".into());
        }
        after = next;
    }
    task.status = project_status(&s, &turns);
    task.items = items;
    task.required_actions = s["required_actions"]
        .as_array()
        .cloned()
        .unwrap_or_default();
    task.result = task
        .items
        .iter()
        .filter(|i| i["role"] == "assistant" || i["type"] == "message")
        .filter(|i| i["role"] != "user")
        .map(item_text)
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("\n\n");
    task.error = None;
    task.updated_at = now();
    save_task(&state, &task)?;
    Ok(task)
}
#[tauri::command]
pub async fn remote_control(
    state: State<'_, CompanionState>,
    task_id: String,
    action: String,
    request_id: Option<String>,
) -> Result<RemoteTask, String> {
    let mut task = get_task(&state, &task_id)?;
    let session = task
        .session_id
        .clone()
        .filter(|s| valid_id(s))
        .ok_or("REMOTE_SESSION_UNAVAILABLE")?;
    let key = remote_key_for(&*state.stored.lock().map_err(|_| "STATE_UNAVAILABLE")?)?
        .ok_or("REMOTE_KEY_NOT_CONFIGURED")?;
    let client = client()?;
    match action.as_str() {
        "cancel" => {
            request(
                &client,
                &key,
                reqwest::Method::POST,
                &format!("/{session}/events"),
                Some(json!({"events":[{"type":"agent.session.input.cancel"}]})),
            )
            .await?;
            task.status = "cancellation_requested".into();
        }
        "release" => {
            request(
                &client,
                &key,
                reqwest::Method::DELETE,
                &format!("/{session}"),
                None,
            )
            .await?;
            task.status = "released".into();
            task.required_actions.clear();
        }
        "approve" | "deny" => {
            let id = request_id.ok_or("APPROVAL_ID_REQUIRED")?;
            // Refresh current required actions; historical requests never authorize an operation.
            let current = request(
                &client,
                &key,
                reqwest::Method::GET,
                &format!("/{session}"),
                None,
            )
            .await?;
            if !current["required_actions"].as_array().is_some_and(|a| {
                a.iter().any(|r| {
                    r["request_id"] == id
                        && r["type"] == "computer_use_approval_request"
                        && r["request"]["type"] == "browser_origin_access"
                })
            }) {
                return Err("APPROVAL_EXPIRED_OR_UNSUPPORTED".into());
            }
            request(&client,&key,reqwest::Method::POST,&format!("/{session}/events"),Some(json!({"events":[{"type":"agent.session.input.computer_use_approval_request_result","request_id":id,"response":{"type":"browser_origin_access","decision":action}}]}))).await?;
            task.status = "approval_response_sent".into(); // Wait for provider state, never invent acceptance/completion.
        }
        _ => return Err("UNSUPPORTED_REMOTE_CONTROL".into()),
    }
    task.updated_at = now();
    save_task(&state, &task)?;
    Ok(task)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[tokio::test]
    async fn authenticated_transport_does_not_follow_redirects() {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let target = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let source = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://{}", source.local_addr().unwrap());
        let response = format!(
            "HTTP/1.1 307 Temporary Redirect\r\nLocation: http://{}/other\r\nContent-Length: 0\r\nConnection: close\r\n\r\n",
            target.local_addr().unwrap()
        );
        let server = tokio::spawn(async move {
            let (mut socket, _) = source.accept().await.unwrap();
            let mut bytes = [0; 2048];
            socket.read(&mut bytes).await.unwrap();
            socket.write_all(response.as_bytes()).await.unwrap();
        });
        // Transport fixture only; never invoke the remote task/session adapter.
        let response = client()
            .unwrap()
            .get(url)
            .bearer_auth("fixture-only-value")
            .timeout(std::time::Duration::from_millis(500))
            .send()
            .await
            .unwrap();
        assert_eq!(response.status().as_u16(), 307);
        server.await.unwrap();
        assert!(
            tokio::time::timeout(std::time::Duration::from_millis(50), target.accept())
                .await
                .is_err()
        );
    }
    #[test]
    fn idle_session_cannot_finish_a_task() {
        assert_eq!(
            project_status(&json!({"status":"idle"}), &json!({"data":[]})),
            "idle"
        );
    }
    #[test]
    fn only_root_turn_outcome_is_used() {
        assert_eq!(
            project_status(
                &json!({"status":"idle"}),
                &json!({"data":[{"status":"completed","subagent_id":"child"},{"status":"failed","subagent_id":null}]})
            ),
            "failed"
        );
    }
    #[test]
    fn provider_approval_overrides_ordinary_status() {
        assert_eq!(
            project_status(
                &json!({"status":"running","required_actions":[{"request_id":"r"}]}),
                &json!({"data":[]})
            ),
            "requires_action"
        );
    }
}
