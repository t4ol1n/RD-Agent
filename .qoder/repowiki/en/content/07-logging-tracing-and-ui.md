# Logging, Tracing & UI (`rdagent/log`)

RD-Agent runs are long (hours to days) and LLM-heavy, so observability is a first-class concern. This package provides a tagged object logger, a file-based trace format, two UIs (Streamlit, Flask+Vue), and run-summarization tools.

## The logger — [`logger.py`](../../../../rdagent/log/logger.py)

`RDAgentLog` (singleton, exported as `rdagent.log.rdagent_logger`) wraps `loguru`:

- **Tagged context** — `logger.tag("Loop_0.coding")` is a `ContextVar`-backed context manager; nested tags form dotted paths. Tags are thread/coroutine safe and inherited by forked subprocesses.
- **`log_object(obj, tag=...)`** — serializes (pickles) any Python object into the trace storage under `<current_tag>.<tag>.<pid-chain>`. This is how hypotheses, experiments, feedbacks, coder workspaces etc. become inspectable after a run.
- **Text logging** — `info/warning/error` with caller info patched into records; a `raw=True` mode prints unformatted output.
- **PID chains** — `get_pids()` builds `parent-...-child` pid strings so parallel/subprocess logs can be attributed and ordered.
- **Pluggable storages** — default `FileStorage(LOG_SETTINGS.trace_path)` plus additional storages from `LOG_SETTINGS.storages` (e.g. `WebStorage` pushing to the UI server). `set_storages_path` / `truncate_storages` support session checkout.

## Trace storage — [`storage.py`](../../../../rdagent/log/storage.py) / [`base.py`](../../../../rdagent/log/base.py)

- `Storage` (abstract) with `log`, `iter_msg`, `truncate`; `FileStorage` writes messages to disk in a tag/PID-organized tree:

```
<trace_path>/
├── __session__/            # LoopBase step snapshots (pickle)
│   ├── 0/0_direct_exp_gen
│   ├── 0/1_coding
│   └── ...
├── <tag-tree>/...          # logged objects + common_logs.log per PID
└── timer.pkl               # global timer state
```

- [`conf.py`](../../../../rdagent/log/conf.py) — `LOG_SETTINGS` (`trace_path`, registered storages, UI server port for live mode).
- [`timer.py`](../../../../rdagent/log/timer.py) — `RDAgentTimer` countdown with persisted state, used by loops and CoSTEER.
- [`utils/`](../../../../rdagent/log/utils) — trace parsing helpers (`get_caller_info`, `extract_loopid_func_name`, `is_valid_session`, JSON extraction, colors).

## Streamlit UIs — [`ui/`](../../../../rdagent/log/ui)

Launched by `rdagent ui`:

- `app.py` — general trace viewer (factor/model loops): windows for hypothesis, feedback, tasks, workspaces (`web.py` defines `StWindow` renderers like `HypothesisWindow`, `FactorTaskWindow`, `WorkspaceWindow`).
- `dsapp.py` — data-science-scenario viewer (selected via `rdagent ui --data-science`).
- `ds_user_interact.py` — real-time interaction app (`rdagent ds_user_interact`) for human-in-the-loop steering.
- `storage.py` / `conf.py` — `WebStorage` and UI settings.

## Flask server — [`server/app.py`](../../../../rdagent/log/server/app.py)

`rdagent server_ui` runs a Flask app (CORS-enabled, default port **19899**) that:

- Serves the static Vue build from `UI_SETTING.static_path` (default `./git_ignore_folder/static`; build via `npm run build:flask` in [`web/`](../../../../web)).
- Manages runs as `RDAgentTask` objects: each launches the scenario in a **separate `multiprocessing.Process`**, redirects its stdout to a `.log` file, and exposes it through REST endpoints:
  - start/stop/run a scenario (with uploaded competition files for data science),
  - stream logged messages per trace id (`/receive` style polling with per-client pointers),
  - download trace artifacts.
- Provides **user-interaction IPC**: two `multiprocessing.Queue`s (`user_request_q` server-bound dicts to render, `user_response_q` user answers) connected to `RDLoop._set_interactor`, enabling hypothesis/feedback editing in the browser. Targets without interaction: `general_model`, `fin_factor_report`.

## Run summarization — [`mle_summary.py`](../../../../rdagent/log/mle_summary.py)

`grade_summary` (CLI: `rdagent grade_summary <log_folder>`) scans finished data-science traces, grades submissions against competition metrics (median/medal thresholds for MLE-bench), and produces per-run statistics (loop count, submissions, scores). [`log/utils/folder.py`](../../../../rdagent/log/utils/folder.py) helps locate session points after a given duration.
