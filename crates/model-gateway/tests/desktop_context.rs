use model_gateway::{
    ModelRole, ProviderCapabilities, UnifiedMessage, UnifiedModelRequest, build_chat_request,
};
use serde_json::json;

#[test]
fn confirmed_images_only_enter_their_own_user_message() {
    let mut r = UnifiedModelRequest::with_user_text("What is visible?");
    r.messages.insert(
        0,
        UnifiedMessage {
            role: ModelRole::System,
            content: "Be concise".into(),
        },
    );
    r.context.insert(
        "ordibot_images".into(),
        json!({"1":["data:image/png;base64,aGVsbG8="]}).to_string(),
    );
    let wire = build_chat_request(
        &r,
        &ProviderCapabilities {
            chat_completions: true,
            vision: true,
            ..Default::default()
        },
    )
    .unwrap();
    assert_eq!(wire["messages"][0]["content"], "Be concise");
    assert_eq!(
        wire["messages"][1]["content"][0]["text"],
        "What is visible?"
    );
    assert_eq!(
        wire["messages"][1]["content"][1]["image_url"]["url"],
        "data:image/png;base64,aGVsbG8="
    );
}

#[test]
fn text_only_provider_rejects_images_instead_of_pretending_to_see() {
    let mut r = UnifiedModelRequest::with_user_text("Screenshot");
    r.context.insert(
        "ordibot_images".into(),
        json!({"0":["data:image/png;base64,aGVsbG8="]}).to_string(),
    );
    assert!(
        build_chat_request(
            &r,
            &ProviderCapabilities {
                chat_completions: true,
                ..Default::default()
            }
        )
        .is_err()
    );
}

#[test]
fn image_payload_cannot_attach_to_system_role_or_remote_url() {
    for (role, url) in [
        (ModelRole::System, "data:image/png;base64,aGVsbG8="),
        (ModelRole::User, "https://example.com/image.png"),
    ] {
        let mut r = UnifiedModelRequest::with_user_text("Context");
        r.messages[0].role = role;
        r.context
            .insert("ordibot_images".into(), json!({"0":[url]}).to_string());
        assert!(
            build_chat_request(
                &r,
                &ProviderCapabilities {
                    chat_completions: true,
                    vision: true,
                    ..Default::default()
                }
            )
            .is_err()
        );
    }
}
