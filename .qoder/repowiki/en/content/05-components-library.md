# Components Library (`rdagent/components`)

Reusable, scenario-agnostic building blocks that implement the core contracts. The most important is **CoSTEER** (Collaborative Evolving Strategy for automatic data-centric development) — the evolving coder at the heart of the "D".

## `coder/CoSTEER` — the evolving coder

[`__init__.py`](../../../../rdagent/components/coder/CoSTEER/__init__.py): `CoSTEER(Developer[Experiment])` implements `develop(exp)`:

1. Wraps the experiment in an `EvolvingItem` ([`evolvable_subjects.py`](../../../../rdagent/components/coder/CoSTEER/evolvable_subjects.py)).
2. Creates a `RAGEvoAgent` with the scenario's `EvolvingStrategy` (code generation/revision) and `RAGEvaluator` (execution-based checks).
3. Iterates `multistep_evolve` up to `max_loop`, keeping the **best acceptable candidate as fallback** (`should_use_new_evo`), checkpointing workspaces via `create_ws_ckp`.
4. Honors per-develop time limits and the global `RDAgentTimer`; raises `CoderError` if all tasks fail.

Supporting files:

- [`config.py`](../../../../rdagent/components/coder/CoSTEER/config.py) — `CoSTEERSettings`: `max_loop`, knowledge base paths, file-lock config.
- [`evaluators.py`](../../../../rdagent/components/coder/CoSTEER/evaluators.py) — `CoSTEERMultiFeedback` (per-subtask execution/return-checking/code feedback), evaluator chaining.
- [`evolving_strategy.py`](../../../../rdagent/components/coder/CoSTEER/evolving_strategy.py) — LLM-driven code generation & revision prompts.
- [`knowledge_management.py`](../../../../rdagent/components/coder/CoSTEER/knowledge_management.py) — `CoSTEERRAGStrategyV1/V2`: experience base of success/failure snippets, embedding-indexed retrieval, self-generated knowledge, on-disk persistence.

## `coder/<domain>` — domain coders

Each domain coder plugs tasks/workspaces/evaluators into CoSTEER:

| Package | Contents |
|---------|----------|
| `coder/data_science/` | The MLE/Kaggle coder family: `feature`, `model`, `ensemble`, `pipeline`, `workflow`, `raw_data_loader` (each with `__init__` coder, `eval.py`, `exp.py`, `test.py`), plus `share/` (eval helpers, notebook utilities, `DSCoSTEER` glue) and `conf.py` |
| `coder/factor_coder/` | Qlib factor implementation: `factor.py` (factor tasks/workspaces), `evaluators.py`, `eva_utils.py`, `evolving_strategy.py` |
| `coder/model_coder/` | Model implementation: `model.py`, one-shot generation, benchmark ground-truth code (`benchmark/gt_code/*.py` for GNN models), `task_loader.py` |
| `coder/finetune/` | Fine-tuning code generation with `unified_validator.py` |
| `coder/rl/` | RL-oriented `costeer.py` variant |

## `proposal` — LLM hypothesis generation

[`__init__.py`](../../../../rdagent/components/proposal/__init__.py) provides the generic LLM-backed "R":

- `LLMHypothesisGen` — template-driven: subclasses implement `prepare_context(trace)` and `convert_response(resp)`; prompts come from `prompts.yaml` via the template engine `T(".prompts:hypothesis_gen.*")`.
- Flavor variants: `FactorHypothesisGen`, `ModelHypothesisGen`, `FactorAndModelHypothesisGen` (set `targets`).
- `LLMHypothesis2Experiment` (+ Factor/Model/Both variants) — converts a hypothesis into experiment tasks with `@wait_retry(retry_n=5)`; uses `json_mode` chat completions.

## `runner` — execution developer

[`__init__.py`](../../../../rdagent/components/runner/__init__.py): `CachedRunner(Developer)` — base for runners that hash task information (`md5_hash`) to reuse prior results (`assign_cached_result`). Scenario runners (see [Scenarios](08-scenarios.md)) subclass it and execute via `rdagent/utils/env.py` (Docker/conda).

## `loader` — turning data into tasks

- `task_loader.py` — `pd.DataFrame` → `Task` list utilities (factor/model loaders).
- `experiment_loader.py` — experiment-level loaders.
Used by `fin_factor` JSON/PDF factor loaders in `rdagent/scenarios/qlib/factor_experiment_loader/`.

## `benchmark` — evaluation harness

- `eval_method.py` — reusable benchmark evaluation methods (used by factor/model benchmark apps under `rdagent/app/benchmark/`).
- `conf.py`, `configs/`, `utils.py` — benchmark settings & helpers.

## `knowledge_management`

- `vector_base.py` — `DataFrameVectorBase`: embedding-backed similarity search over pandas frames (used by CoSTEER RAG).
- `graph.py` — graph-based knowledge structures (`networkx`).

## `agent` — external agent integrations

- `base.py` — `BaseAgent` / `PAIAgent`: a [pydantic-ai](https://ai.pydantic.dev/) agent wrapper with MCP toolsets (`MCPServerStreamableHTTP`) and optional Prefect-cached queries (`nest_asyncio` required).
- `mcp/` — MCP server plumbing; `rag/` — RAG agent config; `context7/` — Context7 library-doc lookup agent.

## `document_reader`

[`document_reader.py`](../../../../rdagent/components/document_reader/document_reader.py) — PDF/document ingestion (pymupdf/pypdf, Azure Document Intelligence) powering `fin_factor_report` and `general_model`.

## `interactor`

Human-in-the-loop interaction helper used by the Flask server to let users edit hypotheses/feedback while a loop runs.

## `workflow`

- `rd_loop.py` — `RDLoop` (see [Workflow Loop Engine](04-workflow-loop-engine.md)).
- `conf.py` — `BasePropSetting` (scenario wiring).
