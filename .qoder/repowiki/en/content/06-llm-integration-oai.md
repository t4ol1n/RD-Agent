# LLM Integration (`rdagent/oai`)

The `oai` package is the **only** subsystem that talks to LLM providers. All components call it through the `APIBackend` abstraction, gaining retry, caching, JSON mode, and multi-provider support for free.

## Configuration — [`llm_conf.py`](../../../../rdagent/oai/llm_conf.py)

`LLMSettings` (singleton `LLM_SETTINGS`) is pydantic-settings based; keys are set via environment variables / `.env` (upper-snake-case). Highlights:

| Setting | Purpose |
|---------|---------|
| `backend` | Backend class path; default `rdagent.oai.backend.LiteLLMAPIBackend` |
| `chat_model` / `embedding_model` | LiteLLM model identifiers (e.g. `gpt-4o`, `deepseek/deepseek-chat`, `azure/<deployment>`, `litellm_proxy/<embedding>`) |
| `reasoning_effort` | low/medium/high for reasoning models |
| `reasoning_think_rm` | Strip `<think>…</think>` tags from reasoning-model outputs |
| `enable_response_schema` | Structured-output (JSON schema) enforcement where supported |
| `max_retry`, `retry_wait_seconds`, `timeout_fail_limit` | Robustness knobs |
| `use_chat_cache` / `dump_chat_cache`, `use_embedding_cache`, `prompt_cache_path` | SQLite lazy cache controls |
| `chat_temperature`, `chat_max_tokens`, `chat_token_limit`, `default_system_prompt`, `system_prompt_role` | Chat behavior (role customizable for models without `system` role, e.g. o1) |
| Azure / endpoint keys | `chat_azure_api_base`, `azure_api_key`, GCR endpoints, DeepSeek-on-Azure, etc. |

## Backend abstraction — [`backend/base.py`](../../../../rdagent/oai/backend/base.py)

- `APIBackend(ABC)` — contract providing **auto retry, cache, and auto-continue**. Key public methods:
  - `build_messages_and_create_chat_completion(user_prompt, system_prompt, former_messages, json_mode, json_target_type, …)` — the workhorse used everywhere.
  - `create_embedding(input_content)` — single or batch embeddings.
  - `build_messages_and_calculate_token(...)` — token accounting.
  - Internally `_try_create_chat_completion_or_embedding` centralizes retry/backoff and cache lookup.
- `JSONParser` — robust extraction of JSON objects/arrays from LLM text (used with `json_mode`).
- `CodeBlockParser` — extracts fenced code blocks from responses.
- `SQliteLazyCache` (singleton) — on-disk cache for chat/embedding responses keyed by content+seed.
- `SessionChatHistoryCache` / `ChatSession` — multi-turn session management.

## Backends

- [`backend/litellm.py`](../../../../rdagent/oai/backend/litellm.py) — `LiteLLMAPIBackend(APIBackend)` + `LiteLLMSettings`. **Default.** Routes to any LiteLLM-supported provider (OpenAI, Azure, DeepSeek, SiliconFlow proxy, …) based on the model prefix in `CHAT_MODEL`/`EMBEDDING_MODEL`.
- [`backend/deprec.py`](../../../../rdagent/oai/backend/deprec.py) — `DeprecBackend`: legacy direct OpenAI/Azure implementation kept for backward compatibility.
- [`backend/pydantic_ai.py`](../../../../rdagent/oai/backend/pydantic_ai.py) — `get_agent_model()` exposing the chat model to `pydantic-ai` agents (used by `PAIAgent` in components).

## Helpers — [`llm_utils.py`](../../../../rdagent/oai/llm_utils.py)

- `get_api_backend()` — factory returning the configured `BaseAPIBackend`.
- `calculate_embedding_distance_between_str_list(...)` — semantic similarity helper used by RAG/knowledge management.

## Embedding utilities — [`utils/embedding.py`](../../../../rdagent/oai/utils/embedding.py)

- `get_embedding_max_tokens(model)`, `trim_text_for_embedding(text, model)`, `truncate_content_list(...)` — model-aware token trimming before embedding.

## Usage pattern

```python
from rdagent.oai.llm_utils import APIBackend

resp = APIBackend().build_messages_and_create_chat_completion(
    user_prompt=user_prompt,
    system_prompt=system_prompt,
    json_mode=True,
    json_target_type=dict[str, str],
)
```

Prompts are rendered by the template engine `T(...)` from [`rdagent/utils/agent/tpl.py`](../../../../rdagent/utils/agent/tpl.py), which loads `prompts.yaml` files colocated with each module — keeping prompt text out of Python code.
