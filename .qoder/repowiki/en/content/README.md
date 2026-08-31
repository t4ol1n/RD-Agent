# RD-Agent Repository Wiki

Welcome to the repository wiki of **RD-Agent** — an LLM-based agent framework that automates the most critical and valuable aspects of data-driven R&D: proposing ideas ("R") and implementing them ("D").

This wiki is auto-generated from the source code and organized by subsystem. Use the navigation below to jump to a topic.

## 📚 Wiki Contents

| # | Document | Description |
|---|----------|-------------|
| 1 | [Project Overview](01-project-overview.md) | What RD-Agent is, supported scenarios, tech stack, and top-level directory layout |
| 2 | [System Architecture](02-system-architecture.md) | Layered architecture, the R&D loop, and module dependency relationships |
| 3 | [Core Abstractions](03-core-abstractions.md) | `rdagent/core`: Experiment, Task, Workspace, Hypothesis, Trace, Scenario, and evolving framework |
| 4 | [Workflow Loop Engine](04-workflow-loop-engine.md) | `LoopBase` / `LoopMeta` async step scheduling, session store/resume, parallelism |
| 5 | [Components Library](05-components-library.md) | `rdagent/components`: CoSTEER coder, proposal, runner, loader, benchmark, knowledge management |
| 6 | [LLM Integration (OAI)](06-llm-integration-oai.md) | `rdagent/oai`: LLM settings, API backends (LiteLLM), caching, parsers, embeddings |
| 7 | [Logging, Tracing & UI](07-logging-tracing-and-ui.md) | `rdagent/log`: RDAgentLog, FileStorage, Streamlit UI, Flask log server |
| 8 | [Scenarios](08-scenarios.md) | `rdagent/scenarios`: data science / Kaggle, qlib quant, LLM fine-tune, general model, RL |
| 9 | [CLI & Applications](09-cli-and-applications.md) | `rdagent/app`: CLI commands, scenario entry points, health check |
| 10 | [Web Frontend](10-web-frontend.md) | `web/`: Vue 3 + Vite frontend served by `rdagent server_ui` |
| 11 | [Development & Testing](11-development-and-testing.md) | Build, lint, test, packaging, and documentation workflows |

## 🗺️ Quick Orientation

- **Entry point**: the `rdagent` CLI is defined in [`rdagent/app/cli.py`](../../../../rdagent/app/cli.py) (Typer app, registered in `pyproject.toml` `[project.scripts]`).
- **Heart of the framework**: the R&D loop implemented by [`LoopBase`](../../../../rdagent/utils/workflow/loop.py) and [`RDLoop`](../../../../rdagent/components/workflow/rd_loop.py).
- **Code evolution engine**: [CoSTEER](../../../../rdagent/components/coder/CoSTEER/__init__.py) — Collaborative Evolving Strategy for automatic data-centric development.
- **Configuration**: pydantic-settings based; global settings in [`rdagent/core/conf.py`](../../../../rdagent/core/conf.py), LLM settings in [`rdagent/oai/llm_conf.py`](../../../../rdagent/oai/llm_conf.py), `.env` loaded at CLI start.

## ℹ️ About This Wiki

- Generated from repository state on 2026-08-31.
- Articles reference source files with repo-relative links; open them in the IDE to navigate to code.
- For user-facing documentation (installation guides, scenario tutorials), see the `docs/` folder and [readthedocs](https://rdagent.readthedocs.io/).
