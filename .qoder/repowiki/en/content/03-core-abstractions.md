# Core Abstractions (`rdagent/core`)

The `core` package defines the scenario-agnostic vocabulary of the framework. Everything else (components, scenarios) implements or configures these contracts. Files: [`conf.py`](../../../../rdagent/core/conf.py), [`experiment.py`](../../../../rdagent/core/experiment.py), [`proposal.py`](../../../../rdagent/core/proposal.py), [`scenario.py`](../../../../rdagent/core/scenario.py), [`developer.py`](../../../../rdagent/core/developer.py), [`evaluation.py`](../../../../rdagent/core/evaluation.py), [`evolving_framework.py`](../../../../rdagent/core/evolving_framework.py), [`evolving_agent.py`](../../../../rdagent/core/evolving_agent.py), [`knowledge_base.py`](../../../../rdagent/core/knowledge_base.py), [`interactor.py`](../../../../rdagent/core/interactor.py), [`prompts.py`](../../../../rdagent/core/prompts.py), [`utils.py`](../../../../rdagent/core/utils.py), [`exception.py`](../../../../rdagent/core/exception.py).

## Configuration — `conf.py`

- `ExtendedBaseSettings` — extends pydantic `BaseSettings` so that **parent-class environment variables are honored** by subclasses (custom `settings_customise_sources` that builds `EnvSettingsSource` for every `ExtendedBaseSettings` in the MRO). All settings classes in the project derive from it.
- `RDAgentSettings` (singleton `RD_AGENT_SETTINGS`) — global knobs:
  - `workspace_path` — where experiment workspaces live (default `git_ignore_folder/RD-Agent_workspace`); checkpoint size limit & whitelist.
  - `multi_proc_n`, `step_semaphore` — parallelism. `step_semaphore` is an int or per-step dict (e.g. `{"coding": 3, "running": 2}`); `get_max_parallel()` derives worker count.
  - `cache_with_pickle`, `pickle_cache_folder_path_str`, `use_file_lock` — pickle-based result caching.
  - `stdout_context_len` / `stdout_line_len` — truncation limits for captured stdout fed to LLMs.
  - `subproc_step` / `is_force_subproc()` — force steps into subprocesses (used when parallel > 1).
  - `app_tpl` — template path override for applications (e.g. finetune).

## Experiment Domain — `experiment.py`

| Class | Role |
|-------|------|
| `Task` / `AbsTask` | A unit of work with `name`, `version`, `description`, `user_instructions`. Scenarios subclass (factor task, model task, pipeline task…). |
| `Workspace` | Abstract container holding the implementation of a task: `target_task`, `feedback`, `running_info`, `execute()`. Copy to snapshot. |
| `FBWorkspace` | **F**ile-**b**ased workspace: a folder with data, code, and output; pipeline is `prepare()` → `execute()`. Supports checkpoints (`create_ws_ckp` / `recover_ws_ckp`) to guard against in-place mutation. |
| `ExperimentPlan` | `dict[str, Any]` plan consumed stage-by-stage (e.g. base features for quant). |
| `Experiment` | The central object: `sub_tasks`, `sub_workspace_list` (implementations), `experiment_workspace` (integration), `hypothesis` that spawned it, `based_experiments`, `result`, `metric`. Generic over task/workspace types. |
| `RunningInfo` | Captured execution output (stdout/stderr) attached to a workspace. |

## Proposal Domain — `proposal.py`

The "R" side of the loop:

- `Hypothesis` — an idea with structured rationale: `hypothesis`, `reason`, plus concise `observation` / `justification` / `knowledge` fields used to build prompts and feedback.
- `Feedback` (`evaluation.py`) — base evaluation result. `ExperimentFeedback` adds a boolean `decision` (was the experiment accepted), `reason`, optional `exception`, `code_change_summary`. `HypothesisFeedback` extends it with `observations`, `hypothesis_evaluation`, `new_hypothesis`, `acceptable` — the verdict that drives the next hypothesis.
- `Trace[Scenario, KnowledgeBase]` — the loop's **memory**:
  - `hist: list[tuple[Experiment, ExperimentFeedback]]` recorded over time;
  - `dag_parent: list[tuple[int, ...]]` parent indices forming a **DAG of experiments** (supports new roots `()` and multi-parent nodes);
  - `idx2loop_id` maps recording order back to loop indices (parallel loops record out of order);
  - selection helpers: `SEL_LATEST_SOTA = (-1,)`, `get_sota_hypothesis_and_experiment()`, `get_parent_exps()`, `sync_dag_parent_and_hist()` (called by `record` step).
- Abstract generators (implemented per scenario):
  - `ExpGen` / `HypothesisGen.gen(trace, plan) -> Hypothesis`
  - `Hypothesis2Experiment.convert(hypothesis, trace) -> Experiment`
  - `Experiment2Feedback.generate_feedback(exp, trace) -> Feedback`
  - `ExpPlanner` — optional planning stage (used by data science scenario).
  - `CheckpointSelector` / `SOTAexpSelector` — selection policies for resumed runs.

## Scenario — `scenario.py`

`Scenario(ABC)` describes the problem domain to LLMs: rich textual description, expected output format/interface. Every prompt builder consumes `scen.rich_style_description` etc. Concrete scenarios: `DataScienceScen`, `KaggleScen`, `QlibFactorScenario`, `FinetuneScen`, … (see [Scenarios](08-scenarios.md)).

## Developer — `developer.py`

`Developer(ABC)[Experiment]` with a single contract: `develop(exp) -> exp`. Coders and runners are both Developers — a coder fills `sub_workspace_list`, a runner executes and fills results. `CoSTEER` (see [Components](05-components-library.md)) is the flagship Developer implementation.

## Evolving Framework — `evolving_framework.py` / `evolving_agent.py`

A mini framework for *iterative self-improvement* that powers CoSTEER:

- `EvolvableSubjects` / `EvolvingItem` — the thing being improved (an experiment workspace).
- `EvolvingStrategy` — `evolve_iter(evo, queried_knowledge, evolving_trace)` produces the next candidate (LLM-driven).
- `EvoStep` — one evolution iteration: subject + queried knowledge + feedback.
- `EvolvingTrace` — ordered list of `EvoStep`s.
- `RAGStrategy` / `QueriedKnowledge` — retrieve relevant experience for the current state.
- `EvoAgent` → `RAGEvoAgent` — orchestrates `multistep_evolve(evo, evaluator)`: alternate strategy-evolve and RAG-evaluate until `max_loop`; supports knowledge self-generation and file locking for parallel workers.
- `RAGEvaluator` — evaluates candidates, optionally streaming sub-feedback (`evaluate_iter`).

## Other Core Files

- `KnowledgeBase` — pickle-backed persistent knowledge store base class.
- `Interactor` — abstract hook for human-in-the-loop intervention on experiments.
- `Prompts` — singleton `dict[str, str]` loading prompt templates from `prompts.yaml` files (every module can ship its own).
- `utils.py` — `SingletonBaseClass`, `import_class(dotted.path.Class)` (the backbone of scenario pluggability), `CacheSeedGen`.
- `exception.py` — domain exceptions: `CoderError`, `RunnerError`, `PolicyError` (with `caused_by_timeout` flag) used by loop skip/withdraw logic.
