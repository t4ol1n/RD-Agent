# Project Overview

## What is RD-Agent?

**RD-Agent** (`rdagent`, "Research & Development Agent") is an LLM-agent framework from Microsoft Research (MSRA-MIIC) that automates data-driven R&D. Its methodological core is a two-part framework:

- **"R" (Research)** — proposing new ideas / hypotheses from knowledge, data observations, or documents (papers, financial reports).
- **"D" (Development)** — implementing those ideas as runnable code through an *evolving* process that learns from execution feedback.

The project targets the hypothesis → experiment → feedback cycle that human experts perform daily, and it supports linking the loop to real-world verification (e.g. running models on Qlib backtest data or Kaggle/MLE-bench tasks). It currently runs on **Linux** and requires **Docker** for most scenarios.

## Supported Scenarios

Scenarios live under [`rdagent/scenarios/`](../../../../rdagent/scenarios) and are launched from the CLI (see [CLI & Applications](09-cli-and-applications.md)):

| Scenario | CLI command | Purpose |
|----------|-------------|---------|
| Quant factor evolution | `rdagent fin_factor` | Iteratively propose & implement Qlib factors |
| Quant model evolution | `rdagent fin_model` | Iteratively propose & implement Qlib models |
| Factor + model co-evolution | `rdagent fin_quant` | Joint factor–model optimization (RD-Agent(Q)) |
| Factor extraction from reports | `rdagent fin_factor_report` | Read financial reports, extract & implement factors |
| General model extraction | `rdagent general_model <paper URL>` | Read papers, extract & implement model structures |
| Data science / Kaggle / MLE-bench | `rdagent data_science --competition <name>` | Autonomous ML engineering on tabular/competition tasks |
| LLM fine-tuning (FT-Agent) | `rdagent llm_finetune` | Benchmark-driven autonomous LLM fine-tuning |

Highlights: RD-Agent is the top-performing ML engineering agent on [MLE-bench](https://github.com/openai/mle-bench), and RD-Agent(Q) is described as the first data-centric quant multi-agent framework (NeurIPS 2025).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Python ≥ 3.10 (3.10 / 3.11 tested in CI) |
| Configuration | `pydantic-settings` (`ExtendedBaseSettings`), `.env` via `python-dotenv` |
| LLM access | LiteLLM (default backend), OpenAI/Azure SDKs, `pydantic-ai` for agent-model integration |
| CLI | `typer` |
| Execution envs | Docker SDK (`docker`), conda/local envs |
| Logging / tracing | `loguru` + custom `FileStorage` trace system |
| Trace UIs | Streamlit (`rdagent ui`), Flask + Vue 3 (`rdagent server_ui`) |
| Data | `pandas`, `numpy`, `pyarrow`, scikit-learn |
| PDF/document reading | `pymupdf`, `pypdf`, Azure Document Intelligence |
| Vector/RAG | embeddings via LLM provider, custom vector & graph knowledge stores |
| Frontend (`web/`) | Vue 3, Vite 8, TypeScript, Element Plus, ECharts, vue-router |

## Top-Level Directory Layout

```
RD-Agent/
├── rdagent/                 # Python package
│   ├── app/                 # CLI entry points & per-scenario launchers
│   ├── core/                # Scenario-agnostic abstractions (Experiment, Hypothesis, Trace…)
│   ├── components/          # Reusable building blocks (CoSTEER coder, proposal, runner…)
│   ├── scenarios/           # Concrete scenario implementations (data_science, qlib, kaggle…)
│   ├── oai/                 # LLM integration layer (backends, cache, parsers)
│   ├── log/                 # Logging/tracing + Streamlit UI + Flask server
│   └── utils/               # Env (docker/conda), workflow loop engine, repo/fmt helpers
├── web/                     # Vue 3 frontend for the Flask log server (server_ui)
├── test/                    # pytest suite (oai, utils, notebook, finetune, qlib, rl)
├── docs/                    # Sphinx documentation source
├── constraints/             # Pinned dependency constraints per Python version
├── requirements/            # Optional dependency groups (docs, lint, test, torch…)
├── .devcontainer/           # Dev container definition
├── pyproject.toml           # Packaging, tool config (ruff, mypy, pytest…), `rdagent` script
├── Makefile                 # dev / lint / test / docs / release targets
└── requirements.txt         # Runtime dependencies
```

## Key Design Principles

1. **Separation of proposal and implementation** — `HypothesisGen` ("R") is decoupled from `Developer` ("D") so each can evolve independently.
2. **Evolution over one-shot generation** — implementations are refined through evaluate → revise loops (CoSTEER), with a knowledge base accumulating experience.
3. **Resumable workflows** — every loop step snapshots itself (`dump`/`load` in `LoopBase`), enabling session restore (`--checkout`) and time-budgeted runs.
4. **Scenario pluggability** — scenarios are wired by class-path strings (e.g. `DS_SCEN`) resolved at runtime via `import_class`, keeping the framework scenario-agnostic.
5. **Observable runs** — all objects of interest are logged through a tagged trace system and browsable via Streamlit or the Vue web UI.
