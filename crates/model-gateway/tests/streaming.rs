use model_gateway::*;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
async fn run_stream(body: &str, split: Option<usize>) -> (Result<(), ModelError>, Vec<ModelEvent>) {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}/v1", listener.local_addr().unwrap());
    let body = body.as_bytes().to_vec();
    let server = tokio::spawn(async move {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut read = [0; 8192];
        let _ = socket.read(&mut read).await;
        socket.write_all(format!("HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",body.len()).as_bytes()).await.unwrap();
        if let Some(split) = split {
            socket.write_all(&body[..split]).await.unwrap();
            tokio::time::sleep(std::time::Duration::from_millis(25)).await;
            socket.write_all(&body[split..]).await.unwrap();
        } else {
            socket.write_all(&body).await.unwrap();
        }
    });
    let adapter = OpenAiCompatibleChatAdapter::new(
        url,
        ProviderCapabilities {
            chat_completions: true,
            streaming: true,
            ..Default::default()
        },
    );
    let (tx, mut rx) = tokio::sync::mpsc::channel(64);
    let result = adapter
        .stream(&UnifiedModelRequest::with_user_text("Hi"), None, tx)
        .await;
    let mut events = vec![];
    while let Some(e) = rx.recv().await {
        events.push(e)
    }
    server.await.unwrap();
    (result, events)
}
#[tokio::test]
async fn fragmented_utf8_remains_exact() {
    let body = "data: {\"choices\":[{\"delta\":{\"content\":\"你好\"}}]}\n\ndata: [DONE]\n\n";
    let split = body.find('你').unwrap() + 1;
    let (result, events) = run_stream(body, Some(split)).await;
    assert!(result.is_ok());
    assert!(events.contains(&ModelEvent::MessageDelta {
        text: "你好".into()
    }));
}
#[tokio::test]
async fn disconnected_stream_does_not_fabricate_completion() {
    let (result, events) = run_stream(
        "data: {\"choices\":[{\"delta\":{\"content\":\"partial\"}}]}\n\n",
        None,
    )
    .await;
    assert!(result.is_err());
    assert!(!events.contains(&ModelEvent::Completed));
}
