/*
 * DeutschLab AI v1.1: the Gemini provider.
 *
 * This module is the only code that ever sees the Gemini API key. The key
 * lives in the macOS Keychain; the webview can ask whether one is stored
 * (and see its last four characters), replace it or remove it, but no
 * command returns it. Every request goes to one fixed host, sends the key
 * in the `x-goog-api-key` header (never in a URL) and uses `store: false`,
 * so Google keeps no interaction state for later retrieval.
 *
 * The commands are deliberately narrow: "generate structured or plain text
 * with one of these models" and "transcribe this audio clip". There is no
 * way to choose a URL, a header or an arbitrary request body.
 */

use std::sync::OnceLock;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

const API_BASE: &str = "https://generativelanguage.googleapis.com/v1beta";

pub const KEYCHAIN_SERVICE: &str = "com.deutschlab.app.gemini";
pub const KEYCHAIN_ACCOUNT: &str = "gemini-api-key";

/// Text models DeutschLab may call (verified free-tier eligible, Oct 2026).
/// Mirrors `src/lib/ai/models.ts`; a Vitest test keeps the two in step.
pub const TEXT_MODELS: &[&str] = &["gemini-3.5-flash-lite", "gemini-3.8-flash"];
/// Dedicated speech-to-text models.
pub const TRANSCRIBE_MODELS: &[&str] = &["gemini-3.5-transcribe"];

/// Audio formats Gemini accepts that MediaRecorder can produce.
const AUDIO_MIME_TYPES: &[&str] = &[
    "audio/webm",
    "audio/ogg",
    "audio/mp4",
    "audio/m4a",
    "audio/aac",
    "audio/wav",
    "audio/mpeg",
    "audio/mp3",
];

/// ~4 minutes of compressed speech is well under this; inline requests must stay small.
const MAX_AUDIO_BYTES: usize = 8 * 1024 * 1024;
/// Anything shorter than this is not a usable recording.
const MIN_AUDIO_BYTES: usize = 512;
const MAX_SYSTEM_CHARS: usize = 24_000;
const MAX_TURN_CHARS: usize = 12_000;
const MAX_TURNS: usize = 40;
const MAX_TOTAL_CHARS: usize = 80_000;
const MAX_SCHEMA_CHARS: usize = 24_000;

const GENERATE_TIMEOUT: Duration = Duration::from_secs(90);
const TRANSCRIBE_TIMEOUT: Duration = Duration::from_secs(120);
const LIST_TIMEOUT: Duration = Duration::from_secs(20);

/// Used only when a general model (not the Transcribe model) transcribes.
/// Fixed here so the webview cannot change what is asked.
const TRANSCRIBE_PROMPT: &str = "Transcribe this recording of a beginner German learner verbatim. \
Write exactly the words that were spoken, in the language they were spoken (mostly German, sometimes English). \
Do not correct grammar, word order, articles or vocabulary, and do not add words that were not said. \
Mark inaudible parts as [unclear]. If there is no speech, return an empty response. Output only the transcript.";

/*
 * Errors. Serialised as `{ "kind": "...", ... }` for the frontend.
 */

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum AiError {
    NoKey,
    InvalidKey,
    Keychain { message: String },
    InvalidRequest { message: String },
    ModelNotAllowed,
    ModelUnavailable,
    RateLimited { retry_after_seconds: Option<u64> },
    Network,
    Timeout,
    Server { status: u16 },
    BadResponse { message: String },
}

/*
 * Key storage
 */

pub trait SecretStore: Sync {
    fn read(&self) -> Result<Option<String>, AiError>;
    fn write(&self, secret: &str) -> Result<(), AiError>;
    fn remove(&self) -> Result<(), AiError>;
}

/// The macOS Keychain (a generic password item owned by DeutschLab).
pub struct Keychain {
    pub service: &'static str,
    pub account: &'static str,
}

pub const APP_KEYCHAIN: Keychain = Keychain { service: KEYCHAIN_SERVICE, account: KEYCHAIN_ACCOUNT };

#[cfg(target_os = "macos")]
const ERR_SEC_ITEM_NOT_FOUND: i32 = -25300;

#[cfg(target_os = "macos")]
impl SecretStore for Keychain {
    fn read(&self) -> Result<Option<String>, AiError> {
        match security_framework::passwords::get_generic_password(self.service, self.account) {
            Ok(bytes) => String::from_utf8(bytes)
                .map(Some)
                .map_err(|_| AiError::Keychain { message: "The saved key could not be read.".into() }),
            Err(error) if error.code() == ERR_SEC_ITEM_NOT_FOUND => Ok(None),
            Err(error) => Err(AiError::Keychain { message: format!("Keychain error {}.", error.code()) }),
        }
    }

    fn write(&self, secret: &str) -> Result<(), AiError> {
        security_framework::passwords::set_generic_password(self.service, self.account, secret.as_bytes())
            .map_err(|error| AiError::Keychain { message: format!("Keychain error {}.", error.code()) })
    }

    fn remove(&self) -> Result<(), AiError> {
        match security_framework::passwords::delete_generic_password(self.service, self.account) {
            Ok(()) => Ok(()),
            Err(error) if error.code() == ERR_SEC_ITEM_NOT_FOUND => Ok(()),
            Err(error) => Err(AiError::Keychain { message: format!("Keychain error {}.", error.code()) }),
        }
    }
}

#[cfg(not(target_os = "macos"))]
impl SecretStore for Keychain {
    fn read(&self) -> Result<Option<String>, AiError> {
        Err(AiError::Keychain { message: "Secure key storage needs macOS.".into() })
    }
    fn write(&self, _secret: &str) -> Result<(), AiError> {
        Err(AiError::Keychain { message: "Secure key storage needs macOS.".into() })
    }
    fn remove(&self) -> Result<(), AiError> {
        Ok(())
    }
}

/// What the webview may know about the key: whether it exists and its last
/// four characters, so the learner can tell which key is saved.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct KeyStatus {
    pub stored: bool,
    pub hint: Option<String>,
}

pub fn mask_hint(key: &str) -> String {
    let tail: String = key.chars().rev().take(4).collect::<Vec<_>>().into_iter().rev().collect();
    format!("••••{tail}")
}

/// A plausible API key: one token of printable ASCII. The format is not
/// checked further because Google may change it; Test connection verifies it.
pub fn validate_key(key: &str) -> Result<&str, AiError> {
    let key = key.trim();
    let ok = (20..=200).contains(&key.len()) && key.chars().all(|c| c.is_ascii_graphic());
    if ok {
        Ok(key)
    } else {
        Err(AiError::InvalidRequest { message: "That does not look like an API key.".into() })
    }
}

pub fn key_status(store: &dyn SecretStore) -> Result<KeyStatus, AiError> {
    let key = store.read()?;
    Ok(KeyStatus { stored: key.is_some(), hint: key.as_deref().map(mask_hint) })
}

pub fn save_key(store: &dyn SecretStore, key: &str) -> Result<KeyStatus, AiError> {
    let key = validate_key(key)?;
    store.write(key)?;
    key_status(store)
}

pub fn remove_key(store: &dyn SecretStore) -> Result<KeyStatus, AiError> {
    store.remove()?;
    key_status(store)
}

fn require_key(store: &dyn SecretStore) -> Result<String, AiError> {
    store.read()?.ok_or(AiError::NoKey)
}

/*
 * Requests
 */

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Turn {
    /// "user" or "model".
    pub role: String,
    pub text: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateRequest {
    pub model: String,
    pub system_instruction: String,
    pub turns: Vec<Turn>,
    /// JSON schema for structured output; plain text when absent.
    pub response_schema: Option<Value>,
    pub max_output_tokens: u32,
    pub temperature: f32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TranscribeRequest {
    pub model: String,
    pub audio_base64: String,
    pub mime_type: String,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiResult {
    pub text: String,
    pub model: String,
    pub input_tokens: Option<u64>,
    pub output_tokens: Option<u64>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionReport {
    /// Gemini model ids the key can see (only `gemini-*`).
    pub models: Vec<String>,
}

fn invalid(message: &str) -> AiError {
    AiError::InvalidRequest { message: message.into() }
}

pub fn check_text_model(model: &str) -> Result<(), AiError> {
    if TEXT_MODELS.contains(&model) { Ok(()) } else { Err(AiError::ModelNotAllowed) }
}

pub fn build_generate_body(request: &GenerateRequest) -> Result<Value, AiError> {
    check_text_model(&request.model)?;

    if request.turns.is_empty() || request.turns.len() > MAX_TURNS {
        return Err(invalid("The conversation is empty or too long."));
    }
    if request.system_instruction.chars().count() > MAX_SYSTEM_CHARS {
        return Err(invalid("The instructions are too long."));
    }
    if !(64..=8192).contains(&request.max_output_tokens) {
        return Err(invalid("Invalid output limit."));
    }
    if !(0.0..=1.0).contains(&request.temperature) {
        return Err(invalid("Invalid temperature."));
    }
    if request.turns.last().map(|turn| turn.role.as_str()) != Some("user") {
        return Err(invalid("The last turn must be the learner's."));
    }

    let mut total = request.system_instruction.chars().count();
    let mut input = Vec::with_capacity(request.turns.len());

    for turn in &request.turns {
        let length = turn.text.chars().count();
        if length == 0 || length > MAX_TURN_CHARS {
            return Err(invalid("A message is empty or too long."));
        }
        total += length;

        input.push(match turn.role.as_str() {
            "user" => json!({ "type": "user_input", "content": turn.text }),
            "model" => json!({ "type": "model_output", "content": [{ "type": "text", "text": turn.text }] }),
            _ => return Err(invalid("Unknown message role.")),
        });
    }

    if total > MAX_TOTAL_CHARS {
        return Err(invalid("The request is too long."));
    }

    let mut body = json!({
        "model": request.model,
        "store": false,
        "system_instruction": request.system_instruction,
        "input": input,
        "generation_config": {
            "max_output_tokens": request.max_output_tokens,
            "temperature": request.temperature,
        },
    });

    if let Some(schema) = &request.response_schema {
        if !schema.is_object() || schema.to_string().len() > MAX_SCHEMA_CHARS {
            return Err(invalid("Invalid response schema."));
        }
        body["response_format"] = json!({
            "type": "text",
            "mime_type": "application/json",
            "schema": schema,
        });
    }

    Ok(body)
}

/// Normalises MediaRecorder types such as `audio/webm;codecs=opus`.
pub fn normalise_audio_mime(mime: &str) -> Result<&'static str, AiError> {
    let base = mime.split(';').next().unwrap_or("").trim().to_ascii_lowercase();
    AUDIO_MIME_TYPES
        .iter()
        .find(|allowed| **allowed == base)
        .map(|allowed| if *allowed == "audio/mp4" { "audio/m4a" } else { *allowed })
        .ok_or_else(|| invalid("This recording format is not supported."))
}

/// Size of the decoded audio, after checking the text is plain base64.
pub fn decoded_audio_len(data: &str) -> Result<usize, AiError> {
    let valid = data.len().is_multiple_of(4)
        && data.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'+' || b == b'/' || b == b'=');
    if !valid {
        return Err(invalid("The recording could not be read."));
    }
    let padding = data.bytes().rev().take_while(|b| *b == b'=').count();
    Ok(data.len() / 4 * 3 - padding.min(2))
}

pub fn build_transcribe_body(request: &TranscribeRequest) -> Result<Value, AiError> {
    let mime = normalise_audio_mime(&request.mime_type)?;
    let size = decoded_audio_len(&request.audio_base64)?;

    if size < MIN_AUDIO_BYTES {
        return Err(invalid("The recording is empty."));
    }
    if size > MAX_AUDIO_BYTES {
        return Err(invalid("The recording is too long to send."));
    }

    let audio = json!({ "type": "audio", "data": request.audio_base64, "mime_type": mime });

    if TRANSCRIBE_MODELS.contains(&request.model.as_str()) {
        return Ok(json!({
            "model": request.model,
            "store": false,
            "input": [audio],
            "generation_config": {
                "transcription_config": {
                    "language_codes": ["de-DE"],
                    "mode": { "type": "verbatim" },
                },
            },
        }));
    }

    // A general multimodal model can transcribe too (the fallback when the
    // Transcribe model is unavailable to this project).
    check_text_model(&request.model)?;
    Ok(json!({
        "model": request.model,
        "store": false,
        "input": [{ "type": "text", "text": TRANSCRIBE_PROMPT }, audio],
        "generation_config": { "temperature": 0.0, "max_output_tokens": 2048 },
    }))
}

/*
 * Responses
 */

/// Text and token usage from an Interactions API response.
pub fn parse_interaction(body: &Value, model: &str) -> Result<AiResult, AiError> {
    if let Some(status @ ("failed" | "cancelled")) = body.get("status").and_then(Value::as_str) {
        return Err(AiError::BadResponse { message: format!("The request {status}.") });
    }

    let mut text = String::new();
    for step in body.get("steps").and_then(Value::as_array).into_iter().flatten() {
        if step.get("type").and_then(Value::as_str) != Some("model_output") {
            continue;
        }
        for part in step.get("content").and_then(Value::as_array).into_iter().flatten() {
            if part.get("type").and_then(Value::as_str) == Some("text")
                && let Some(piece) = part.get("text").and_then(Value::as_str)
            {
                text.push_str(piece);
            }
        }
    }

    let usage = body.get("usage");
    let tokens = |field: &str| usage.and_then(|u| u.get(field)).and_then(Value::as_u64);
    let output_tokens = match (tokens("total_output_tokens"), tokens("total_thought_tokens")) {
        (Some(output), Some(thought)) => Some(output + thought),
        (output, _) => output,
    };

    Ok(AiResult {
        text,
        model: model.to_string(),
        input_tokens: tokens("total_input_tokens"),
        output_tokens,
    })
}

/// Seconds to wait from a `Retry-After` header or a google.rpc.RetryInfo detail.
pub fn retry_after_seconds(header: Option<&str>, body: &Value) -> Option<u64> {
    if let Some(seconds) = header.and_then(|value| value.trim().parse::<u64>().ok()) {
        return Some(seconds.min(3600));
    }

    body.pointer("/error/details")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(|detail| detail.get("retryDelay").and_then(Value::as_str))
        .filter_map(|delay| delay.trim_end_matches('s').parse::<f64>().ok())
        .map(|seconds| (seconds.ceil() as u64).min(3600))
        .next()
}

/// Maps an HTTP failure to an error the learner can act on.
pub fn map_http_error(status: u16, retry_after: Option<&str>, body: &Value) -> AiError {
    let message = body.pointer("/error/message").and_then(Value::as_str).unwrap_or("");
    let reason = body.to_string();
    let key_problem = reason.contains("API_KEY_INVALID")
        || reason.contains("API_KEY_SERVICE_BLOCKED")
        || message.to_ascii_lowercase().contains("api key");

    match status {
        429 => AiError::RateLimited { retry_after_seconds: retry_after_seconds(retry_after, body) },
        401 => AiError::InvalidKey,
        400 | 403 if key_problem => AiError::InvalidKey,
        403 => AiError::InvalidKey,
        404 => AiError::ModelUnavailable,
        400 => AiError::InvalidRequest { message: short(message) },
        500..=599 => AiError::Server { status },
        _ => AiError::Server { status },
    }
}

fn short(message: &str) -> String {
    let trimmed: String = message.chars().take(200).collect();
    if trimmed.is_empty() { "Gemini rejected the request.".into() } else { trimmed }
}

/// Removes the key from any text before it can reach the webview.
pub fn redact(error: AiError, key: &str) -> AiError {
    let clean = |text: String| if key.is_empty() { text } else { text.replace(key, "[redacted]") };
    match error {
        AiError::InvalidRequest { message } => AiError::InvalidRequest { message: clean(message) },
        AiError::BadResponse { message } => AiError::BadResponse { message: clean(message) },
        AiError::Keychain { message } => AiError::Keychain { message: clean(message) },
        other => other,
    }
}

/*
 * Transport
 */

fn client() -> &'static reqwest::Client {
    static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
    CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .connect_timeout(Duration::from_secs(15))
            .build()
            .expect("HTTP client")
    })
}

fn transport_error(error: reqwest::Error) -> AiError {
    if error.is_timeout() { AiError::Timeout } else { AiError::Network }
}

async fn send(key: &str, request: reqwest::RequestBuilder, timeout: Duration) -> Result<Value, AiError> {
    let response = request
        .header("x-goog-api-key", key)
        .timeout(timeout)
        .send()
        .await
        .map_err(transport_error)?;

    let status = response.status().as_u16();
    let retry_after = response
        .headers()
        .get(reqwest::header::RETRY_AFTER)
        .and_then(|value| value.to_str().ok())
        .map(str::to_owned);
    let text = response.text().await.map_err(transport_error)?;
    let body: Value = serde_json::from_str(&text).unwrap_or(Value::Null);

    if (200..300).contains(&status) {
        if body.is_null() {
            return Err(AiError::BadResponse { message: "Gemini sent an unreadable response.".into() });
        }
        Ok(body)
    } else {
        Err(redact(map_http_error(status, retry_after.as_deref(), &body), key))
    }
}

pub async fn generate(store: &dyn SecretStore, request: GenerateRequest) -> Result<AiResult, AiError> {
    let body = build_generate_body(&request)?;
    let key = require_key(store)?;
    let url = format!("{API_BASE}/interactions");
    let response = send(&key, client().post(url).json(&body), GENERATE_TIMEOUT).await?;
    parse_interaction(&response, &request.model)
}

pub async fn transcribe(store: &dyn SecretStore, request: TranscribeRequest) -> Result<AiResult, AiError> {
    let body = build_transcribe_body(&request)?;
    let key = require_key(store)?;
    let url = format!("{API_BASE}/interactions");
    let response = send(&key, client().post(url).json(&body), TRANSCRIBE_TIMEOUT).await?;
    parse_interaction(&response, &request.model)
}

pub fn parse_model_list(body: &Value) -> Vec<String> {
    let mut models: Vec<String> = body
        .get("models")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(|model| model.get("name").and_then(Value::as_str))
        .map(|name| name.trim_start_matches("models/").to_string())
        .filter(|name| name.starts_with("gemini-"))
        .collect();
    models.sort();
    models.dedup();
    models
}

/// Lists the models the key can see. Proves the key works without spending a generation request.
pub async fn test_connection(store: &dyn SecretStore) -> Result<ConnectionReport, AiError> {
    let key = require_key(store)?;
    let mut models = Vec::new();
    let mut page_token: Option<String> = None;

    // At most three pages; the list is short.
    for _ in 0..3 {
        let mut url = format!("{API_BASE}/models?pageSize=200");
        if let Some(token) = &page_token {
            // Page tokens are opaque; keep only URL-safe characters.
            let token: String = token.chars().filter(|c| c.is_ascii_alphanumeric() || "-_=".contains(*c)).collect();
            url.push_str(&format!("&pageToken={token}"));
        }
        let body = send(&key, client().get(url), LIST_TIMEOUT).await?;
        models.extend(parse_model_list(&body));
        page_token = body.get("nextPageToken").and_then(Value::as_str).map(str::to_owned);
        if page_token.is_none() {
            break;
        }
    }

    models.sort();
    models.dedup();
    Ok(ConnectionReport { models })
}

/*
 * Tauri commands (registered in lib.rs)
 */

#[tauri::command]
pub async fn ai_key_status() -> Result<KeyStatus, AiError> {
    key_status(&APP_KEYCHAIN)
}

#[tauri::command]
pub async fn ai_save_key(key: String) -> Result<KeyStatus, AiError> {
    save_key(&APP_KEYCHAIN, &key)
}

#[tauri::command]
pub async fn ai_remove_key() -> Result<KeyStatus, AiError> {
    remove_key(&APP_KEYCHAIN)
}

#[tauri::command]
pub async fn ai_test_connection() -> Result<ConnectionReport, AiError> {
    test_connection(&APP_KEYCHAIN).await
}

#[tauri::command]
pub async fn ai_generate(request: GenerateRequest) -> Result<AiResult, AiError> {
    generate(&APP_KEYCHAIN, request).await
}

#[tauri::command]
pub async fn ai_transcribe(request: TranscribeRequest) -> Result<AiResult, AiError> {
    transcribe(&APP_KEYCHAIN, request).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    #[derive(Default)]
    struct MemoryStore(Mutex<Option<String>>);

    impl SecretStore for MemoryStore {
        fn read(&self) -> Result<Option<String>, AiError> {
            Ok(self.0.lock().unwrap().clone())
        }
        fn write(&self, secret: &str) -> Result<(), AiError> {
            *self.0.lock().unwrap() = Some(secret.to_string());
            Ok(())
        }
        fn remove(&self) -> Result<(), AiError> {
            *self.0.lock().unwrap() = None;
            Ok(())
        }
    }

    const KEY: &str = "AIzaSyTESTKEY-0123456789abcdefghijKLMN";

    fn generate_request(model: &str) -> GenerateRequest {
        GenerateRequest {
            model: model.into(),
            system_instruction: "You are a German teacher.".into(),
            turns: vec![Turn { role: "user".into(), text: "Ich habe ein Bruder.".into() }],
            response_schema: Some(json!({ "type": "object", "properties": {} })),
            max_output_tokens: 2048,
            temperature: 0.2,
        }
    }

    #[test]
    fn key_status_never_contains_the_key() {
        let store = MemoryStore::default();
        assert_eq!(key_status(&store).unwrap(), KeyStatus { stored: false, hint: None });

        let status = save_key(&store, &format!("  {KEY}\n")).unwrap();
        assert!(status.stored);
        assert_eq!(status.hint.as_deref(), Some("••••KLMN"));

        let serialised = serde_json::to_string(&status).unwrap();
        assert!(!serialised.contains(KEY));
        assert!(!serialised.contains("AIzaSy"));

        // Stored trimmed.
        assert_eq!(store.read().unwrap().as_deref(), Some(KEY));

        assert_eq!(remove_key(&store).unwrap(), KeyStatus { stored: false, hint: None });
        assert!(!remove_key(&store).unwrap().stored);
    }

    #[test]
    fn rejects_implausible_keys() {
        for bad in ["", "short", "has a space in it 1234567890", &"x".repeat(300), "ключ-ключ-ключ-ключ-ключ"] {
            assert!(validate_key(bad).is_err(), "{bad}");
        }
        assert!(validate_key(KEY).is_ok());
    }

    #[test]
    fn requests_without_a_key_fail_before_sending() {
        let store = MemoryStore::default();
        assert_eq!(require_key(&store), Err(AiError::NoKey));
    }

    #[test]
    fn generate_body_is_stateless_and_carries_no_key() {
        let body = build_generate_body(&generate_request("gemini-3.5-flash-lite")).unwrap();
        assert_eq!(body["store"], json!(false));
        assert_eq!(body["model"], json!("gemini-3.5-flash-lite"));
        assert_eq!(body["input"][0], json!({ "type": "user_input", "content": "Ich habe ein Bruder." }));
        assert_eq!(body["response_format"]["mime_type"], json!("application/json"));
        assert!(!body.to_string().contains("AIza"));
    }

    #[test]
    fn multi_turn_history_uses_model_output_steps() {
        let mut request = generate_request("gemini-3.8-flash");
        request.response_schema = None;
        request.turns = vec![
            Turn { role: "user".into(), text: "Hallo!".into() },
            Turn { role: "model".into(), text: "Hallo! Wie heißt du?".into() },
            Turn { role: "user".into(), text: "Ich heiße Sam.".into() },
        ];
        let body = build_generate_body(&request).unwrap();
        assert_eq!(body["input"][1]["type"], json!("model_output"));
        assert_eq!(body["input"][1]["content"][0]["text"], json!("Hallo! Wie heißt du?"));
        assert!(body.get("response_format").is_none());
    }

    #[test]
    fn only_listed_models_can_be_called() {
        for model in ["gemini-4-argon", "gemini-3.1-pro-preview", "../models", "gemini-3.5-transcribe", ""] {
            assert_eq!(build_generate_body(&generate_request(model)), Err(AiError::ModelNotAllowed), "{model}");
        }
    }

    #[test]
    fn rejects_oversized_or_malformed_generate_requests() {
        let mut request = generate_request("gemini-3.8-flash");
        request.turns = vec![];
        assert!(build_generate_body(&request).is_err());

        let mut request = generate_request("gemini-3.8-flash");
        request.turns[0].text = "a".repeat(MAX_TURN_CHARS + 1);
        assert!(build_generate_body(&request).is_err());

        let mut request = generate_request("gemini-3.8-flash");
        request.turns.push(Turn { role: "model".into(), text: "Hallo".into() });
        assert!(build_generate_body(&request).is_err(), "must end with the learner");

        let mut request = generate_request("gemini-3.8-flash");
        request.turns[0].role = "system".into();
        assert!(build_generate_body(&request).is_err());

        let mut request = generate_request("gemini-3.8-flash");
        request.max_output_tokens = 1_000_000;
        assert!(build_generate_body(&request).is_err());
    }

    #[test]
    fn audio_types_and_sizes_are_checked() {
        assert_eq!(normalise_audio_mime("audio/webm;codecs=opus"), Ok("audio/webm"));
        assert_eq!(normalise_audio_mime("audio/mp4"), Ok("audio/m4a"));
        assert!(normalise_audio_mime("video/mp4").is_err());
        assert!(normalise_audio_mime("text/html").is_err());

        assert_eq!(decoded_audio_len("QUJD"), Ok(3));
        assert_eq!(decoded_audio_len("QUI="), Ok(2));
        assert!(decoded_audio_len("not base64!").is_err());

        let request = |data: String| TranscribeRequest {
            model: "gemini-3.5-transcribe".into(),
            audio_base64: data,
            mime_type: "audio/webm".into(),
        };
        assert_eq!(
            build_transcribe_body(&request("QUJD".into())),
            Err(AiError::InvalidRequest { message: "The recording is empty.".into() })
        );
        let too_big = "A".repeat((MAX_AUDIO_BYTES / 3 + 10) * 4);
        assert!(build_transcribe_body(&request(too_big)).is_err());
    }

    #[test]
    fn transcription_is_verbatim_german_and_stateless() {
        let audio = "A".repeat(4096);
        let body = build_transcribe_body(&TranscribeRequest {
            model: "gemini-3.5-transcribe".into(),
            audio_base64: audio.clone(),
            mime_type: "audio/webm;codecs=opus".into(),
        })
        .unwrap();
        assert_eq!(body["store"], json!(false));
        assert_eq!(body["generation_config"]["transcription_config"]["mode"]["type"], json!("verbatim"));
        assert_eq!(body["generation_config"]["transcription_config"]["language_codes"], json!(["de-DE"]));
        assert_eq!(body["input"][0]["mime_type"], json!("audio/webm"));

        // Fallback through a general model uses the fixed verbatim prompt.
        let fallback = build_transcribe_body(&TranscribeRequest {
            model: "gemini-3.5-flash-lite".into(),
            audio_base64: audio.clone(),
            mime_type: "audio/mp4".into(),
        })
        .unwrap();
        assert_eq!(fallback["input"][0]["text"], json!(TRANSCRIBE_PROMPT));

        let refused = build_transcribe_body(&TranscribeRequest {
            model: "gemini-4-argon".into(),
            audio_base64: audio,
            mime_type: "audio/webm".into(),
        });
        assert_eq!(refused, Err(AiError::ModelNotAllowed));
    }

    #[test]
    fn parses_text_and_usage() {
        let body = json!({
            "status": "completed",
            "steps": [
                { "type": "thought", "content": [{ "type": "text", "text": "hidden" }] },
                { "type": "model_output", "content": [{ "type": "text", "text": "{\"a\":" }, { "type": "text", "text": "1}" }] }
            ],
            "usage": { "total_input_tokens": 50, "total_output_tokens": 10, "total_thought_tokens": 5 }
        });
        let result = parse_interaction(&body, "gemini-3.8-flash").unwrap();
        assert_eq!(result.text, "{\"a\":1}");
        assert_eq!(result.input_tokens, Some(50));
        assert_eq!(result.output_tokens, Some(15));

        assert!(parse_interaction(&json!({ "status": "failed" }), "m").is_err());
        assert_eq!(parse_interaction(&json!({}), "m").unwrap().text, "");
    }

    #[test]
    fn maps_http_failures() {
        let retry = json!({ "error": { "code": 429, "details": [
            { "@type": "type.googleapis.com/google.rpc.RetryInfo", "retryDelay": "17.4s" }
        ] } });
        assert_eq!(map_http_error(429, None, &retry), AiError::RateLimited { retry_after_seconds: Some(18) });
        assert_eq!(map_http_error(429, Some("30"), &json!({})), AiError::RateLimited { retry_after_seconds: Some(30) });
        assert_eq!(map_http_error(429, None, &json!({})), AiError::RateLimited { retry_after_seconds: None });

        let bad_key = json!({ "error": { "message": "API key not valid. Please pass a valid API key.",
            "details": [{ "reason": "API_KEY_INVALID" }] } });
        assert_eq!(map_http_error(400, None, &bad_key), AiError::InvalidKey);
        assert_eq!(map_http_error(403, None, &json!({})), AiError::InvalidKey);
        assert_eq!(map_http_error(404, None, &json!({})), AiError::ModelUnavailable);
        assert_eq!(map_http_error(503, None, &json!({})), AiError::Server { status: 503 });
        assert!(matches!(map_http_error(400, None, &json!({ "error": { "message": "Bad schema" } })),
            AiError::InvalidRequest { message } if message == "Bad schema"));
    }

    #[test]
    fn redacts_the_key_from_messages() {
        let error = AiError::InvalidRequest { message: format!("echo {KEY} back") };
        assert_eq!(redact(error, KEY), AiError::InvalidRequest { message: "echo [redacted] back".into() });
    }

    #[test]
    fn lists_only_gemini_models() {
        let body = json!({ "models": [
            { "name": "models/gemini-3.8-flash" },
            { "name": "models/embedding-001" },
            { "name": "models/gemini-3.5-transcribe" },
            { "name": "models/gemini-3.8-flash" }
        ] });
        assert_eq!(parse_model_list(&body), vec!["gemini-3.5-transcribe", "gemini-3.8-flash"]);
    }

    #[test]
    fn errors_serialise_with_a_kind() {
        let value = serde_json::to_value(AiError::RateLimited { retry_after_seconds: Some(5) }).unwrap();
        assert_eq!(value, json!({ "kind": "rate_limited", "retry_after_seconds": 5 }));
        assert_eq!(serde_json::to_value(AiError::NoKey).unwrap(), json!({ "kind": "no_key" }));
    }

    /// Real Keychain round trip under a separate test service. Opt-in:
    /// `cargo test keychain -- --ignored` (never touches the app's item).
    #[cfg(target_os = "macos")]
    #[test]
    #[ignore]
    fn keychain_round_trip() {
        let store = Keychain { service: "com.deutschlab.app.selftest", account: "keychain-test" };
        store.remove().unwrap();
        assert_eq!(store.read().unwrap(), None);
        store.write(KEY).unwrap();
        assert_eq!(store.read().unwrap().as_deref(), Some(KEY));
        store.write("AIzaSyREPLACED-0123456789abcdefghijKLMN").unwrap();
        assert_eq!(key_status(&store).unwrap().hint.as_deref(), Some("••••KLMN"));
        store.remove().unwrap();
        assert_eq!(store.read().unwrap(), None);
    }
}
