use model_gateway::*;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

async fn exchange(status: &str, extra: &str) -> (Result<Vec<ModelEvent>, ModelError>, String) {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}/v1", listener.local_addr().unwrap());
    let response =
        format!("HTTP/1.1 {status}\r\n{extra}Content-Length: 0\r\nConnection: close\r\n\r\n");
    let server = tokio::spawn(async move {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut bytes = [0; 8192];
        let n = socket.read(&mut bytes).await.unwrap();
        socket.write_all(response.as_bytes()).await.unwrap();
        String::from_utf8(bytes[..n].to_vec()).unwrap()
    });
    let adapter = OpenAiCompatibleChatAdapter::new(
        url,
        ProviderCapabilities {
            chat_completions: true,
            ..Default::default()
        },
    );
    let mut request = UnifiedModelRequest::with_user_text("fixture");
    request.timeout_ms = Some(250);
    let outcome = adapter.complete(&request, Some("fixture-only-value")).await;
    (outcome, server.await.unwrap())
}

#[test]
fn parameter_policies_omit_unsupported_temperature_and_select_the_token_field() {
    for (policy, token_field, temperature) in [
        ("standard", "max_tokens", true),
        ("completion", "max_completion_tokens", false),
        ("no-temperature", "max_tokens", false),
    ] {
        let mut value =
            serde_json::to_value(UnifiedModelRequest::with_user_text("fixture")).unwrap();
        value["parameterPolicy"] = serde_json::json!(policy);
        value["maxOutputTokens"] = serde_json::json!(256);
        let request: UnifiedModelRequest = serde_json::from_value(value).unwrap();
        let body = build_chat_request(
            &request,
            &ProviderCapabilities {
                chat_completions: true,
                ..Default::default()
            },
        )
        .unwrap();
        assert_eq!(body[token_field], 256);
        assert_eq!(body.get("temperature").is_some(), temperature);
        assert!(!(body.get("max_tokens").is_some() && body.get("max_completion_tokens").is_some()));
    }
}

#[tokio::test]
async fn loopback_never_receives_authorization_even_with_a_key_argument() {
    let (_, request) = exchange("401 Unauthorized", "").await;
    assert!(!request.to_lowercase().contains("authorization:"));
    assert!(!request.contains("fixture-only-value"));
}

#[tokio::test]
async fn redirects_are_rejected_without_following_the_destination() {
    let target = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let location = format!(
        "Location: http://{}/other\r\n",
        target.local_addr().unwrap()
    );
    let (result, _) = exchange("307 Temporary Redirect", &location).await;
    assert!(matches!(
        result,
        Err(ModelError::HttpRejected { status: 307, .. })
    ));
    assert!(
        tokio::time::timeout(std::time::Duration::from_millis(50), target.accept())
            .await
            .is_err()
    );
}
